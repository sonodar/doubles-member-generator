import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { EventSourceMapping, type Function as LambdaFunction, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { eventCleaner } from "./functions/eventCleaner/resource";
import { pushNotifier } from "./functions/pushNotifier/resource";

/**
 * Amplify Gen 2 バックエンド定義
 *
 * - auth: Cognito Identity Pool を有効化（ゲストアクセス用）
 * - data: GraphQL API（AppSync + DynamoDB）
 * - eventCleaner: Environment 削除時に子レコードを削除する Lambda 関数
 *
 * @see https://docs.amplify.aws/react/build-a-backend/
 */
const backend = defineBackend({
	auth,
	data,
	eventCleaner,
	pushNotifier,
});

const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.name = `DoublesMemberGenerator-${process.env.AWS_BRANCH || "sandbox"}`;

// DynamoDB テーブルへの参照を取得
const { tables, cfnResources } = backend.data.resources;
const environmentTable = tables.Environment;
const eventTable = tables.Event;
const subscriptionTable = tables.PushSubscription;

// Environment テーブルの TTL を有効化（ttl フィールドを使用）
cfnResources.amplifyDynamoDbTables.Environment.timeToLiveAttribute = {
	attributeName: "ttl",
	enabled: true,
};

// EventCleaner Lambda の設定
(() => {
	const lambda = backend.eventCleaner.resources.lambda as LambdaFunction;
	const stack = Stack.of(environmentTable);

	// DynamoDB Streams 読み取り権限
	const streamsPolicy = new Policy(stack, "EventCleanerStreamsPolicy", {
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					"dynamodb:DescribeStream",
					"dynamodb:GetRecords",
					"dynamodb:GetShardIterator",
					"dynamodb:ListStreams",
				],
				resources: [environmentTable.tableStreamArn!],
			}),
		],
	});
	lambda.role?.attachInlinePolicy(streamsPolicy);

	// 子テーブルへの読み取り・削除権限
	const eventTablePolicy = new Policy(stack, "EventCleanerEventTablePolicy", {
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["dynamodb:Query", "dynamodb:DeleteItem", "dynamodb:BatchWriteItem"],
				resources: [
					eventTable.tableArn,
					`${eventTable.tableArn}/index/*`,
					subscriptionTable.tableArn,
					`${subscriptionTable.tableArn}/index/*`,
				],
			}),
		],
	});
	lambda.role?.attachInlinePolicy(eventTablePolicy);

	// 環境変数でテーブル名を Lambda に渡す
	lambda.addEnvironment("EVENT_TABLE_NAME", eventTable.tableName);
	lambda.addEnvironment("SUBSCRIPTION_TABLE_NAME", subscriptionTable.tableName);

	// DynamoDB Streams → Lambda のイベントソースマッピング
	const eventSourceMapping = new EventSourceMapping(stack, "EventCleanerStreamMapping", {
		target: lambda,
		eventSourceArn: environmentTable.tableStreamArn,
		startingPosition: StartingPosition.LATEST,
		batchSize: 10,
		retryAttempts: 3,
	});
	eventSourceMapping.node.addDependency(streamsPolicy);
})();

// pushNotifier Lambda の設定
(() => {
	const lambda = backend.pushNotifier.resources.lambda as LambdaFunction;
	const stack = Stack.of(eventTable);

	// Event テーブルの DynamoDB Streams を有効化
	cfnResources.amplifyDynamoDbTables.Event.streamSpecification = {
		streamViewType: StreamViewType.NEW_IMAGE,
	};

	// DynamoDB Streams 読み取り権限
	const streamsPolicy = new Policy(stack, "PushNotifierStreamsPolicy", {
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: [
					"dynamodb:DescribeStream",
					"dynamodb:GetRecords",
					"dynamodb:GetShardIterator",
					"dynamodb:ListStreams",
				],
				resources: [eventTable.tableStreamArn!],
			}),
		],
	});
	lambda.role?.attachInlinePolicy(streamsPolicy);

	// PushSubscription テーブルへの読み取り・削除権限
	const subscriptionTablePolicy = new Policy(stack, "PushNotifierSubscriptionTablePolicy", {
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["dynamodb:Query", "dynamodb:DeleteItem"],
				resources: [subscriptionTable.tableArn, `${subscriptionTable.tableArn}/index/*`],
			}),
		],
	});
	lambda.role?.attachInlinePolicy(subscriptionTablePolicy);

	// Parameter Store 読み取り権限
	const ssmPolicy = new Policy(stack, "PushNotifierSSMPolicy", {
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["ssm:GetParameter"],
				resources: [`arn:aws:ssm:*:*:parameter/doubles-member-generator/*/vapid-private-key`],
			}),
		],
	});
	lambda.role?.attachInlinePolicy(ssmPolicy);

	// 環境変数を設定
	lambda.addEnvironment("SUBSCRIPTION_TABLE_NAME", subscriptionTable.tableName);
	lambda.addEnvironment("VAPID_PUBLIC_KEY", process.env.VITE_VAPID_PUBLIC_KEY ?? "");

	// Parameter Store のパスを環境ごとに設定
	const branch = process.env.AWS_BRANCH || "develop";
	const ssmPath = `/doubles-member-generator/${branch}/vapid-private-key`;
	lambda.addEnvironment("VAPID_PRIVATE_KEY_PARAM", ssmPath);

	// DynamoDB Streams → Lambda のイベントソースマッピング
	const eventSourceMapping = new EventSourceMapping(stack, "PushNotifierStreamMapping", {
		target: lambda,
		eventSourceArn: eventTable.tableStreamArn,
		startingPosition: StartingPosition.LATEST,
		batchSize: 10,
		retryAttempts: 3,
	});
	eventSourceMapping.node.addDependency(streamsPolicy);
})();
