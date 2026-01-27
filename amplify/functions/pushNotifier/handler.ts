import { type AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { DynamoDBRecord, DynamoDBStreamHandler } from "aws-lambda";
import webpush from "web-push";
import { type EventPayload, type EventType, EventType as EventTypes } from "../../../src/api/event";
import type { PushPayload } from "../../../src/sw";
import type { Schema } from "../../data/resource";
import { setupVapidDetails } from "./setup";

type EventModel = Schema["Event"]["type"];
type TargetEventType = Exclude<EventType, "INITIALIZE" | "RETRY">;

// DynamoDB クライアント
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// 通知対象のイベントタイプ
const NOTIFIABLE_EVENT_TYPES = new Set<EventType>([
	EventTypes.Generate,
	EventTypes.Join,
	EventTypes.Leave,
	EventTypes.Finish,
]);

// 通知メッセージの定義
const NOTIFICATION_MESSAGES: Record<TargetEventType, string> = {
	GENERATE: "新しい組み合わせが生成されました",
	JOIN: "新しいメンバーが参加しました",
	LEAVE: "メンバーが離脱しました",
	FINISH: "イベントが終了しました",
};

interface PushSubscriptionData {
	id: string;
	endpoint: string;
	p256dh: string;
	auth: string;
}

/**
 * 主催者を除外した購読者リストを取得
 */
async function getTargetSubscriptions(environmentID: string): Promise<PushSubscriptionData[]> {
	const result = await ddb.send(
		new QueryCommand({
			TableName: process.env.SUBSCRIPTION_TABLE_NAME,
			IndexName: "byEnvironment",
			KeyConditionExpression: "environmentID = :environmentID",
			ExpressionAttributeValues: { ":environmentID": environmentID },
		}),
	);

	const subscriptions = (result.Items ?? []) as PushSubscriptionData[];

	if (subscriptions.length === 0) {
		console.log(`No subscriptions for environment: ${environmentID}`);
		return [];
	}

	return subscriptions;
}

/**
 * 無効な購読を削除
 */
async function deleteSubscription(subscriptionId: string): Promise<void> {
	await ddb.send(
		new DeleteCommand({
			TableName: process.env.SUBSCRIPTION_TABLE_NAME,
			Key: { id: subscriptionId },
		}),
	);
	console.log(`Deleted invalid subscription: ${subscriptionId}`);
}

/**
 * プッシュ通知を送信
 */
async function sendPushNotification(
	{ id: subscriptionId, endpoint, p256dh, auth }: PushSubscriptionData,
	payload: PushPayload,
): Promise<{ success: boolean; subscriptionId: string }> {
	try {
		await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload));
		return { success: true, subscriptionId };
	} catch (error) {
		const statusCode = (error as { statusCode?: number }).statusCode;

		// 410 (Gone) または 404 (Not Found) の場合は購読を削除
		if (statusCode === 410 || statusCode === 404) {
			await deleteSubscription(subscriptionId);
			return { success: false, subscriptionId };
		}

		console.error(`Failed to send notification to ${subscriptionId}:`, error);
		return { success: false, subscriptionId };
	}
}

function isTargetEventType(type: EventType): type is TargetEventType {
	return NOTIFIABLE_EVENT_TYPES.has(type);
}

function toEventModel(record: DynamoDBRecord): EventModel & { payload: EventPayload } {
	const newImage = record.dynamodb?.NewImage;
	if (!newImage) {
		throw new Error("DynamoDB stream record is missing NewImage for INSERT event.");
	}
	const entity = unmarshall(newImage as Record<string, AttributeValue>) as EventModel;
	try {
		const payload = (typeof entity.payload === "string" ? JSON.parse(entity.payload) : entity.payload) as EventPayload;
		return { ...entity, payload };
	} catch {
		throw new Error(`Failed to parse payload: ${entity.payload}`);
	}
}

async function handleRecord(record: DynamoDBRecord): Promise<void> {
	try {
		// INSERT イベントのみ処理
		if (record.eventName !== "INSERT") {
			return;
		}

		const eventModel = toEventModel(record);

		if (!isTargetEventType(eventModel.type)) {
			return;
		}

		// silent フラグが true の場合はスキップ
		if (eventModel.payload.silent === true) {
			return;
		}

		// 必要な情報を取得
		const { id: eventId, environmentID, type: eventType } = eventModel;

		// 主催者を除外した購読者リストを取得
		const subscriptions = await getTargetSubscriptions(environmentID);

		if (subscriptions.length === 0) {
			return;
		}

		const pushPayload: PushPayload = {
			title: "ダブルスメンバー決めるくん",
			body: NOTIFICATION_MESSAGES[eventType],
			icon: "/icon-192x192.png",
			tag: eventId, // 多重送信防止
			data: { url: `/share/${environmentID}` },
		};

		// 並列で通知を送信
		const results = await Promise.all(subscriptions.map((sub) => sendPushNotification(sub, pushPayload)));

		const successCount = results.filter((r) => r.success).length;
		console.log(`Sent ${successCount}/${subscriptions.length} notifications for event: ${eventId}`);
	} catch (e: unknown) {
		console.error("Push notification processing failed for a record.", e);
	}
}

/**
 * Event テーブルへの INSERT を検知してプッシュ通知を送信する Lambda ハンドラー
 */
export const handler: DynamoDBStreamHandler = async (event) => {
	// VAPID 設定（初回のみ実行、失敗時は例外を投げる）
	await setupVapidDetails(
		process.env.VAPID_PUBLIC_KEY ?? "",
		process.env.VAPID_PRIVATE_KEY_PARAM ?? "",
		(subject, pubKey, privKey) => webpush.setVapidDetails(subject, pubKey, privKey),
	);

	// イベントの順序通りに通知を行うべきなので Promise.all などは使わない
	for (const record of event.Records) {
		await handleRecord(record);
	}
};
