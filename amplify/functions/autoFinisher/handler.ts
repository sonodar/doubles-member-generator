/**
 * Auto-Finish Lambda ハンドラー
 *
 * EventBridge スケジュールにより日次で実行され、
 * アイドル状態の Environment を自動的に終了する。
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { ScheduledHandler } from "aws-lambda";
import { autoFinishIdleEnvironments } from "./batch";

/** アイドル判定の閾値（時間） */
const IDLE_THRESHOLD_HOURS = 24;

/** 環境変数からテーブル名を取得 */
const ENVIRONMENT_TABLE_NAME = process.env.ENVIRONMENT_TABLE_NAME ?? "";
const EVENT_TABLE_NAME = process.env.EVENT_TABLE_NAME ?? "";

/** DynamoDB クライアント */
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/**
 * EventBridge スケジュールハンドラー
 */
export const handler: ScheduledHandler = async () => {
	const startTime = new Date();
	console.log(`[AutoFinisher] Started at ${startTime.toISOString()}`);

	await autoFinishIdleEnvironments(
		ddb,
		{
			environmentTableName: ENVIRONMENT_TABLE_NAME,
			eventTableName: EVENT_TABLE_NAME,
			thresholdHours: IDLE_THRESHOLD_HOURS,
		},
		startTime,
	);

	const duration = Date.now() - startTime.getTime();
	console.log(`[AutoFinisher] Completed in ${duration}ms`);
};
