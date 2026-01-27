import type { AttributeValue, DynamoDBStreamEvent } from "aws-lambda";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted でモック関数を先に定義
const { mockDdbSend, mockWebPushSend, mockSetupVapidDetails } = vi.hoisted(() => ({
	mockDdbSend: vi.fn(),
	mockWebPushSend: vi.fn(),
	mockSetupVapidDetails: vi.fn(),
}));

// モジュールをモック
vi.mock("@aws-sdk/client-dynamodb", () => ({
	DynamoDBClient: class MockDynamoDBClient {},
}));

vi.mock("@aws-sdk/lib-dynamodb", () => ({
	DynamoDBDocumentClient: {
		from: () => ({ send: mockDdbSend }),
	},
	QueryCommand: class MockQueryCommand {
		constructor(public params: unknown) {}
	},
	DeleteCommand: class MockDeleteCommand {
		type = "Delete";
		constructor(public params: unknown) {}
	},
}));

vi.mock("web-push", () => ({
	default: {
		sendNotification: (...args: unknown[]) => mockWebPushSend(...args),
	},
}));

vi.mock("./setup", () => ({
	setupVapidDetails: (...args: unknown[]) => mockSetupVapidDetails(...args),
}));

import { handler } from "./handler";

describe("pushNotifier Lambda", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("SUBSCRIPTION_TABLE_NAME", "PushSubscriptionTable");
		// setupVapidDetails をデフォルトで成功させる
		mockSetupVapidDetails.mockResolvedValue(true);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	const createStreamEvent = (
		eventType: string,
		payload: Record<string, unknown> = {},
		eventId = "event-123",
		environmentID = "env-123",
	): DynamoDBStreamEvent => ({
		Records: [
			{
				eventName: "INSERT",
				dynamodb: {
					NewImage: {
						id: { S: eventId },
						environmentID: { S: environmentID },
						type: { S: eventType },
						payload: { S: JSON.stringify(payload) },
						occurredAt: { S: new Date().toISOString() },
					} as Record<string, AttributeValue>,
				},
			},
		],
	});

	describe("VAPID 設定", () => {
		it("setupVapidDetails がエラーを投げた場合は処理を中断する", async () => {
			mockSetupVapidDetails.mockRejectedValue(new Error("VAPID configuration error"));
			const event = createStreamEvent("GENERATE");

			await expect(handler(event, {} as never, vi.fn())).rejects.toThrow("VAPID configuration error");

			expect(mockDdbSend).not.toHaveBeenCalled();
		});
	});

	describe("イベントタイプのフィルタリング", () => {
		it("INITIALIZE イベントは通知対象から除外される", async () => {
			const event = createStreamEvent("INITIALIZE", {});

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).not.toHaveBeenCalled();
		});

		it("RETRY イベントは通知対象から除外される", async () => {
			const event = createStreamEvent("RETRY", {});

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).not.toHaveBeenCalled();
		});

		it("GENERATE イベントは通知対象になる", async () => {
			mockDdbSend.mockResolvedValueOnce({ Items: [] });

			const event = createStreamEvent("GENERATE");

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).toHaveBeenCalled();
		});

		it("JOIN イベントは通知対象になる", async () => {
			mockDdbSend.mockResolvedValueOnce({ Items: [] });

			const event = createStreamEvent("JOIN");

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).toHaveBeenCalled();
		});

		it("LEAVE イベントは通知対象になる", async () => {
			mockDdbSend.mockResolvedValueOnce({ Items: [] });

			const event = createStreamEvent("LEAVE");

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).toHaveBeenCalled();
		});

		it("FINISH イベントは通知対象になる", async () => {
			mockDdbSend.mockResolvedValueOnce({ Items: [] });

			const event = createStreamEvent("FINISH");

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).toHaveBeenCalled();
		});
	});

	describe("silent フラグ", () => {
		it("silent: true の Event は通知対象から除外される", async () => {
			const event = createStreamEvent("GENERATE", { silent: true });

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).not.toHaveBeenCalled();
		});
	});

	describe("通知送信", () => {
		it("購読者全員に通知が送信される", async () => {
			mockDdbSend.mockResolvedValueOnce({
				Items: [
					{
						id: "sub-1",
						endpoint: "https://push.example.com/1",
						p256dh: "key1",
						auth: "auth1",
					},
					{
						id: "sub-2",
						endpoint: "https://push.example.com/2",
						p256dh: "key2",
						auth: "auth2",
					},
				],
			});
			mockWebPushSend.mockResolvedValue({});

			const event = createStreamEvent("GENERATE");

			await handler(event, {} as never, vi.fn());

			expect(mockWebPushSend).toHaveBeenCalledTimes(2);
		});

		it("通知ペイロードが正しい形式で送信される", async () => {
			mockDdbSend.mockResolvedValueOnce({
				Items: [
					{
						id: "sub-1",
						endpoint: "https://push.example.com/1",
						p256dh: "key1",
						auth: "auth1",
					},
				],
			});
			mockWebPushSend.mockResolvedValue({});

			const event = createStreamEvent("GENERATE", {}, "event-456", "env-789");

			await handler(event, {} as never, vi.fn());

			expect(mockWebPushSend).toHaveBeenCalledTimes(1);

			const payloadStr = mockWebPushSend.mock.calls[0][1];
			const payload = JSON.parse(payloadStr);

			expect(payload).toEqual({
				title: "ダブルスメンバー決めるくん",
				body: "新しい組み合わせが生成されました",
				icon: "/icon-192x192.png",
				tag: "event-456",
				data: {
					url: "/share/env-789",
				},
			});
		});

		it("FINISH イベントは「イベントが終了しました」として通知される", async () => {
			mockDdbSend.mockResolvedValueOnce({
				Items: [
					{
						id: "sub-1",
						endpoint: "https://push.example.com/1",
						p256dh: "key1",
						auth: "auth1",
					},
				],
			});
			mockWebPushSend.mockResolvedValue({});

			const event = createStreamEvent("FINISH", {}, "event-999", "env-999");

			await handler(event, {} as never, vi.fn());

			expect(mockWebPushSend).toHaveBeenCalledTimes(1);

			const payloadStr = mockWebPushSend.mock.calls[0][1];
			const payload = JSON.parse(payloadStr);

			expect(payload.body).toBe("イベントが終了しました");
		});

		it("410 エラーの場合は購読を削除する", async () => {
			mockDdbSend
				.mockResolvedValueOnce({
					Items: [
						{
							id: "sub-1",
							endpoint: "https://push.example.com/1",
							p256dh: "key1",
							auth: "auth1",
						},
					],
				})
				.mockResolvedValueOnce({});

			mockWebPushSend.mockRejectedValueOnce({ statusCode: 410 });

			const event = createStreamEvent("GENERATE");

			await handler(event, {} as never, vi.fn());

			expect(mockDdbSend).toHaveBeenCalledTimes(2);
		});
	});
});
