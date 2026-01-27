import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { DynamoDBStreamHandler } from "aws-lambda";
import { chunks } from "../../../src/logic/array";

// 環境変数からテーブル名を取得
// CDK で設定される環境変数
const EVENT_TABLE_NAME = process.env.EVENT_TABLE_NAME ?? "";
const SUBSCRIPTION_TABLE_NAME = process.env.SUBSCRIPTION_TABLE_NAME ?? "";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * Environment が削除された場合（TTL による削除など）に関連する子レコードを削除する。
 * DynamoDB Streams の REMOVE イベントをトリガーとして実行される。
 */
export const handler: DynamoDBStreamHandler = async (event) => {
	for (const record of event.Records) {
		if (record.eventName !== "REMOVE" || !record.dynamodb?.Keys) {
			continue;
		}

		const envId = record.dynamodb.Keys.id?.S;
		if (!envId) continue;

		const [eventDeletes, subDeletes] = await Promise.all([
			deleteItemsByEnvId(EVENT_TABLE_NAME, envId),
			deleteItemsByEnvId(SUBSCRIPTION_TABLE_NAME, envId),
		]);

		await Promise.all([...eventDeletes, ...subDeletes]);

		console.log(`Deleted children for environment: ${envId}`);
	}
};

async function deleteItemsByEnvId(tableName: string, environmentID: string): Promise<Promise<void>[]> {
	const ids = await getIdsByEnvironmentId(tableName, environmentID);
	return deleteItemsById(tableName, ids);
}

async function getIdsByEnvironmentId(tableName: string, environmentID: string): Promise<string[]> {
	const output = await ddb.send(
		new QueryCommand({
			TableName: tableName,
			IndexName: "byEnvironment",
			KeyConditionExpression: "environmentID = :environmentID",
			ExpressionAttributeValues: {
				":environmentID": environmentID,
			},
		}),
	);
	return (output?.Items ?? []).map((item) => item.id as string);
}

function deleteItemsById(tableName: string, ids: string[]): Promise<void>[] {
	if (ids.length === 0) return [];
	// DynamoDB の BatchWriteItem は 1 回のリクエストで最大 25 件まで。それを超えるとエラー。
	return chunks(ids, 25).map((chunkIds) => batchDeleteByIds(tableName, chunkIds));
}

async function batchDeleteByIds(tableName: string, ids: string[]): Promise<void> {
	const batchDelete = new BatchWriteCommand({
		RequestItems: {
			[tableName]: ids.map((id) => ({ DeleteRequest: { Key: { id } } })),
		},
	});
	await ddb.send(batchDelete);
	console.log(`Deleted ${tableName}: ${ids}`);
}
