/**
 * Auto-Finish バッチ処理
 *
 * アイドル状態の Environment を検出し、終了処理を実行する。
 */

import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import {
	type DynamoDBDocumentClient,
	PutCommand,
	QueryCommand,
	ScanCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// ============================================================================
// Types
// ============================================================================

/** アクティブな Environment の情報 */
export interface ActiveEnvironment {
	id: string;
	createdAt: string;
	ttl: number;
}

/** バッチ処理のオプション */
export interface BatchOptions {
	environmentTableName: string;
	eventTableName: string;
	thresholdHours: number;
}

// ============================================================================
// Idle Detection
// ============================================================================

/** 最終アクティビティ日時から指定された閾値時間以上経過しているかを判定する */
export function isIdle(lastActivityAt: Date, thresholdHours: number, currentTime: Date): boolean {
	const thresholdMs = thresholdHours * 60 * 60 * 1000;
	const elapsedMs = currentTime.getTime() - lastActivityAt.getTime();
	return elapsedMs >= thresholdMs;
}

/** 最終アクティビティ日時を決定する（イベントがなければ createdAt を使用） */
export function getLastActivityAt(latestEventOccurredAt: Date | undefined | null, environmentCreatedAt: Date): Date {
	return latestEventOccurredAt ?? environmentCreatedAt;
}

// ============================================================================
// Repository
// ============================================================================

/** 未終了の Environment を全件取得する */
export async function getActiveEnvironments(
	ddb: DynamoDBDocumentClient,
	tableName: string,
): Promise<ActiveEnvironment[]> {
	const environments: ActiveEnvironment[] = [];
	let lastEvaluatedKey: Record<string, unknown> | undefined;

	do {
		const response = await ddb.send(
			new ScanCommand({
				TableName: tableName,
				FilterExpression: "attribute_not_exists(finishedAt)",
				ExclusiveStartKey: lastEvaluatedKey,
			}),
		);

		const items = (response.Items ?? []) as ActiveEnvironment[];
		environments.push(...items);
		lastEvaluatedKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
	} while (lastEvaluatedKey !== undefined);

	return environments;
}

/** 指定された Environment の最新イベント発生日時を取得する */
export async function getLatestEventOccurredAt(
	ddb: DynamoDBDocumentClient,
	tableName: string,
	environmentID: string,
): Promise<Date | undefined> {
	const response = await ddb.send(
		new QueryCommand({
			TableName: tableName,
			IndexName: "byEnvironment",
			KeyConditionExpression: "environmentID = :environmentID",
			ExpressionAttributeValues: { ":environmentID": environmentID },
			ScanIndexForward: false,
			Limit: 1,
		}),
	);

	const items = response.Items ?? [];
	if (items.length === 0) return undefined;

	return new Date(items[0].occurredAt as string);
}

// ============================================================================
// Finisher
// ============================================================================

/** Environment を終了状態にする（条件付き更新で冪等性確保） */
export async function finishEnvironment(
	ddb: DynamoDBDocumentClient,
	tableName: string,
	environmentID: string,
	finishedAt: Date,
): Promise<"finished" | "skipped"> {
	try {
		await ddb.send(
			new UpdateCommand({
				TableName: tableName,
				Key: { id: environmentID },
				UpdateExpression: "SET finishedAt = :finishedAt",
				ConditionExpression: "attribute_not_exists(finishedAt)",
				ExpressionAttributeValues: { ":finishedAt": finishedAt.toISOString() },
			}),
		);
		return "finished";
	} catch (error) {
		if (error instanceof ConditionalCheckFailedException) {
			return "skipped";
		}
		throw error;
	}
}

/** 自動終了イベントを記録する（silent: true, auto: true） */
export async function recordFinishEvent(
	ddb: DynamoDBDocumentClient,
	tableName: string,
	environmentID: string,
	occurredAt: Date,
): Promise<void> {
	const timestamp = occurredAt.toISOString();
	await ddb.send(
		new PutCommand({
			TableName: tableName,
			Item: {
				id: crypto.randomUUID(),
				environmentID,
				type: "FINISH",
				payload: JSON.stringify({ silent: true, auto: true }),
				occurredAt: timestamp,
				createdAt: timestamp,
				updatedAt: timestamp,
			},
		}),
	);
}

// ============================================================================
// Batch Processing
// ============================================================================

/** アイドル状態の Environment を自動終了する */
export async function autoFinishIdleEnvironments(
	ddb: DynamoDBDocumentClient,
	options: BatchOptions,
	targetDate: Date = new Date(),
): Promise<void> {
	const { environmentTableName, eventTableName, thresholdHours } = options;

	const environments = await getActiveEnvironments(ddb, environmentTableName);
	console.log(`[AutoFinisher] Found ${environments.length} active environments`);

	for (const env of environments) {
		const latestEventOccurredAt = await getLatestEventOccurredAt(ddb, eventTableName, env.id);
		const lastActivityAt = getLastActivityAt(latestEventOccurredAt, new Date(env.createdAt));

		if (!isIdle(lastActivityAt, thresholdHours, targetDate)) {
			console.log(`[AutoFinisher] ${env.id}: active`);
			continue;
		}

		try {
			const status = await finishEnvironment(ddb, environmentTableName, env.id, targetDate);
			if (status === "skipped") {
				console.log(`[AutoFinisher] ${env.id}: skipped (already finished)`);
				continue;
			}
			await recordFinishEvent(ddb, eventTableName, env.id, targetDate);
			console.log(`[AutoFinisher] ${env.id}: finished`);
		} catch (error) {
			console.error(`[AutoFinisher] ${env.id}: error`, error);
		}
	}
}
