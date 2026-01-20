import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping, Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { eventCleaner } from "./functions/eventCleaner/resource";

/**
 * Amplify Gen 2 バックエンド定義
 *
 * - auth: Cognito Identity Pool を有効化（ゲストアクセス用）
 * - data: GraphQL API（AppSync + DynamoDB）
 * - eventCleaner: Environment 削除時に関連 Event を削除する Lambda 関数
 *
 * @see https://docs.amplify.aws/react/build-a-backend/
 */
const backend = defineBackend({
	auth,
	data,
	eventCleaner,
});

const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.name = `DoublesMemberGenerator-${process.env.AWS_BRANCH || "sandbox"}`;

// DynamoDB テーブルへの参照を取得
const { tables, cfnResources } = backend.data.resources;
const environmentTable = tables["Environment"];
const eventTable = tables["Event"];

// Environment テーブルの TTL を有効化（ttl フィールドを使用）
cfnResources.amplifyDynamoDbTables["Environment"].timeToLiveAttribute = {
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

	// Event テーブルへの読み取り・削除権限
	const eventTablePolicy = new Policy(stack, "EventCleanerEventTablePolicy", {
		statements: [
			new PolicyStatement({
				effect: Effect.ALLOW,
				actions: ["dynamodb:Query", "dynamodb:DeleteItem"],
				resources: [eventTable.tableArn, `${eventTable.tableArn}/index/*`],
			}),
		],
	});
	lambda.role?.attachInlinePolicy(eventTablePolicy);

	// 環境変数で Event テーブル名を Lambda に渡す
	lambda.addEnvironment("EVENT_TABLE_NAME", eventTable.tableName);

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
