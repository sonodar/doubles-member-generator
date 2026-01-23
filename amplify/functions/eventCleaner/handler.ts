import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBStreamHandler } from "aws-lambda";

// 環境変数から Event テーブル名を取得
// CDK で設定される環境変数
const EVENT_TABLE_NAME = process.env.EVENT_TABLE_NAME ?? "";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * Environment が削除された場合（TTL による削除など）に関連する Event を削除する。
 * DynamoDB Streams の REMOVE イベントをトリガーとして実行される。
 */
export const handler: DynamoDBStreamHandler = async (event) => {
	for (const record of event.Records) {
		if (record.eventName !== "REMOVE" || !record.dynamodb?.Keys) {
			continue;
		}

		const envId = record.dynamodb.Keys.id?.S;
		if (!envId) continue;

		const eventIds = await getEventIdsByEnvironmentId(envId);

		for (const id of eventIds) {
			await deleteEventById(id);
			console.log(`Deleted event: ${id}`);
		}

		console.log(`Deleted ${eventIds.length} events for environment: ${envId}`);
	}
};

async function getEventIdsByEnvironmentId(environmentID: string): Promise<string[]> {
	const output = await ddb.send(
		new QueryCommand({
			TableName: EVENT_TABLE_NAME,
			IndexName: "byEnvironment",
			KeyConditionExpression: "environmentID = :environmentID",
			ExpressionAttributeValues: {
				":environmentID": environmentID,
			},
		}),
	);
	return (output?.Items ?? []).map((item) => item.id as string);
}

async function deleteEventById(id: string): Promise<void> {
	await ddb.send(
		new DeleteCommand({
			TableName: EVENT_TABLE_NAME,
			Key: { id },
		}),
	);
}
