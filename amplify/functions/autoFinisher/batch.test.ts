import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	autoFinishIdleEnvironments,
	finishEnvironment,
	getActiveEnvironments,
	getLastActivityAt,
	getLatestEventOccurredAt,
	isIdle,
	recordFinishEvent,
} from "./batch";

// DynamoDB モック
const mockSend = vi.fn();
const mockDdb = { send: mockSend } as unknown as DynamoDBDocumentClient;

// ============================================================================
// isIdle Tests
// ============================================================================

describe("isIdle", () => {
	const now = new Date("2026-01-28T12:00:00.000Z");

	describe("24時間経過判定", () => {
		it("24時間を超えて経過している場合は true を返す", () => {
			const lastActivityAt = new Date("2026-01-27T11:00:00.000Z");
			expect(isIdle(lastActivityAt, 24, now)).toBe(true);
		});

		it("ちょうど24時間経過している場合は true を返す", () => {
			const lastActivityAt = new Date("2026-01-27T12:00:00.000Z");
			expect(isIdle(lastActivityAt, 24, now)).toBe(true);
		});

		it("24時間未満の場合は false を返す", () => {
			const lastActivityAt = new Date("2026-01-27T13:00:00.000Z");
			expect(isIdle(lastActivityAt, 24, now)).toBe(false);
		});

		it("直近のアクティビティの場合は false を返す", () => {
			const lastActivityAt = new Date("2026-01-28T11:30:00.000Z");
			expect(isIdle(lastActivityAt, 24, now)).toBe(false);
		});
	});

	describe("境界値テスト", () => {
		it("1ミリ秒でも24時間を超えていれば true を返す", () => {
			const lastActivityAt = new Date("2026-01-27T11:59:59.999Z");
			expect(isIdle(lastActivityAt, 24, now)).toBe(true);
		});

		it("24時間より1ミリ秒短い場合は false を返す", () => {
			const lastActivityAt = new Date("2026-01-27T12:00:00.001Z");
			expect(isIdle(lastActivityAt, 24, now)).toBe(false);
		});
	});

	describe("閾値のカスタマイズ", () => {
		it("閾値を48時間に設定した場合、48時間経過で true を返す", () => {
			const lastActivityAt = new Date("2026-01-26T12:00:00.000Z");
			expect(isIdle(lastActivityAt, 48, now)).toBe(true);
		});

		it("閾値を48時間に設定した場合、24時間経過では false を返す", () => {
			const lastActivityAt = new Date("2026-01-27T12:00:00.000Z");
			expect(isIdle(lastActivityAt, 48, now)).toBe(false);
		});
	});
});

// ============================================================================
// getLastActivityAt Tests
// ============================================================================

describe("getLastActivityAt", () => {
	const environmentCreatedAt = new Date("2026-01-25T10:00:00.000Z");

	describe("イベントがある場合", () => {
		it("最新イベントの occurredAt を返す", () => {
			const latestEventOccurredAt = new Date("2026-01-27T15:00:00.000Z");
			expect(getLastActivityAt(latestEventOccurredAt, environmentCreatedAt)).toEqual(latestEventOccurredAt);
		});

		it("イベント日時が Environment 作成日時より前でも、イベント日時を優先する", () => {
			const latestEventOccurredAt = new Date("2026-01-24T10:00:00.000Z");
			expect(getLastActivityAt(latestEventOccurredAt, environmentCreatedAt)).toEqual(latestEventOccurredAt);
		});
	});

	describe("イベントがない場合", () => {
		it("latestEventOccurredAt が undefined の場合、createdAt を返す", () => {
			expect(getLastActivityAt(undefined, environmentCreatedAt)).toEqual(environmentCreatedAt);
		});

		it("latestEventOccurredAt が null の場合、createdAt を返す", () => {
			expect(getLastActivityAt(null, environmentCreatedAt)).toEqual(environmentCreatedAt);
		});
	});
});

// ============================================================================
// getActiveEnvironments Tests
// ============================================================================

describe("getActiveEnvironments", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("Scan + Filter による取得", () => {
		it("finishedAt が未設定の Environment を取得する", async () => {
			mockSend.mockResolvedValueOnce({
				Items: [
					{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 123456 },
					{ id: "env-2", createdAt: "2026-01-26T10:00:00.000Z", ttl: 123457 },
				],
				LastEvaluatedKey: undefined,
			});

			const result = await getActiveEnvironments(mockDdb, "TestEnvironmentTable");

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe("env-1");
			expect(result[1].id).toBe("env-2");
		});

		it("Environment が存在しない場合は空配列を返す", async () => {
			mockSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });
			expect(await getActiveEnvironments(mockDdb, "TestEnvironmentTable")).toHaveLength(0);
		});

		it("Items が undefined の場合は空配列を返す", async () => {
			mockSend.mockResolvedValueOnce({ Items: undefined, LastEvaluatedKey: undefined });
			expect(await getActiveEnvironments(mockDdb, "TestEnvironmentTable")).toHaveLength(0);
		});
	});

	describe("ページネーション対応", () => {
		it("LastEvaluatedKey がある場合は継続して取得する", async () => {
			mockSend
				.mockResolvedValueOnce({
					Items: [{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 1 }],
					LastEvaluatedKey: { id: "env-1" },
				})
				.mockResolvedValueOnce({
					Items: [{ id: "env-2", createdAt: "2026-01-26T10:00:00.000Z", ttl: 2 }],
					LastEvaluatedKey: { id: "env-2" },
				})
				.mockResolvedValueOnce({
					Items: [{ id: "env-3", createdAt: "2026-01-27T10:00:00.000Z", ttl: 3 }],
					LastEvaluatedKey: undefined,
				});

			const result = await getActiveEnvironments(mockDdb, "TestEnvironmentTable");

			expect(result).toHaveLength(3);
			expect(mockSend).toHaveBeenCalledTimes(3);
		});
	});
});

// ============================================================================
// getLatestEventOccurredAt Tests
// ============================================================================

describe("getLatestEventOccurredAt", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("byEnvironment インデックスによる取得", () => {
		it("最新イベントの occurredAt を返す", async () => {
			mockSend.mockResolvedValueOnce({
				Items: [{ id: "event-1", environmentID: "env-1", type: "GENERATE", occurredAt: "2026-01-27T15:00:00.000Z" }],
			});

			const result = await getLatestEventOccurredAt(mockDdb, "TestEventTable", "env-1");
			expect(result).toEqual(new Date("2026-01-27T15:00:00.000Z"));
		});

		it("降順でソートし最初の1件を取得する", async () => {
			mockSend.mockResolvedValueOnce({
				Items: [{ id: "event-latest", environmentID: "env-1", type: "FINISH", occurredAt: "2026-01-28T10:00:00.000Z" }],
			});

			await getLatestEventOccurredAt(mockDdb, "TestEventTable", "env-1");

			const callArg = mockSend.mock.calls[0][0];
			expect(callArg.input).toMatchObject({
				TableName: "TestEventTable",
				IndexName: "byEnvironment",
				ScanIndexForward: false,
				Limit: 1,
			});
		});
	});

	describe("イベントが存在しない場合", () => {
		it("Items が空配列の場合は undefined を返す", async () => {
			mockSend.mockResolvedValueOnce({ Items: [] });
			expect(await getLatestEventOccurredAt(mockDdb, "TestEventTable", "env-1")).toBeUndefined();
		});

		it("Items が undefined の場合は undefined を返す", async () => {
			mockSend.mockResolvedValueOnce({ Items: undefined });
			expect(await getLatestEventOccurredAt(mockDdb, "TestEventTable", "env-1")).toBeUndefined();
		});
	});
});

// ============================================================================
// finishEnvironment Tests
// ============================================================================

describe("finishEnvironment", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("終了成功", () => {
		it("finishedAt を更新し 'finished' を返す", async () => {
			mockSend.mockResolvedValueOnce({});

			const now = new Date("2026-01-28T12:00:00.000Z");
			const result = await finishEnvironment(mockDdb, "TestEnvTable", "env-1", now);

			expect(result).toBe("finished");

			const callArg = mockSend.mock.calls[0][0];
			expect(callArg.input).toMatchObject({
				TableName: "TestEnvTable",
				Key: { id: "env-1" },
				UpdateExpression: "SET finishedAt = :finishedAt",
				ConditionExpression: "attribute_not_exists(finishedAt)",
				ExpressionAttributeValues: { ":finishedAt": "2026-01-28T12:00:00.000Z" },
			});
		});
	});

	describe("既に終了済み", () => {
		it("ConditionalCheckFailedException の場合は 'skipped' を返す", async () => {
			mockSend.mockRejectedValueOnce(new ConditionalCheckFailedException({ message: "", $metadata: {} }));

			const result = await finishEnvironment(mockDdb, "TestEnvTable", "env-1", new Date());
			expect(result).toBe("skipped");
		});
	});

	describe("エラー", () => {
		it("その他のエラーはそのまま throw する", async () => {
			mockSend.mockRejectedValueOnce(new Error("DynamoDB connection error"));

			await expect(finishEnvironment(mockDdb, "TestEnvTable", "env-1", new Date())).rejects.toThrow(
				"DynamoDB connection error",
			);
		});
	});
});

// ============================================================================
// recordFinishEvent Tests
// ============================================================================

describe("recordFinishEvent", () => {
	beforeEach(() => vi.clearAllMocks());

	describe("FINISH イベント発行", () => {
		it("Event テーブルに FINISH イベントを作成する", async () => {
			mockSend.mockResolvedValueOnce({});

			const now = new Date("2026-01-28T12:00:00.000Z");
			await recordFinishEvent(mockDdb, "TestEventTable", "env-1", now);

			const callArg = mockSend.mock.calls[0][0];
			expect(callArg.input.TableName).toBe("TestEventTable");
			expect(callArg.input.Item).toMatchObject({
				environmentID: "env-1",
				type: "FINISH",
				occurredAt: "2026-01-28T12:00:00.000Z",
			});
		});

		it("payload に silent: true と auto: true を含める", async () => {
			mockSend.mockResolvedValueOnce({});

			await recordFinishEvent(mockDdb, "TestEventTable", "env-1", new Date());

			const callArg = mockSend.mock.calls[0][0];
			expect(JSON.parse(callArg.input.Item.payload)).toEqual({ silent: true, auto: true });
		});

		it("一意の id を生成する", async () => {
			mockSend.mockResolvedValue({});

			await recordFinishEvent(mockDdb, "TestEventTable", "env-1", new Date());
			await recordFinishEvent(mockDdb, "TestEventTable", "env-2", new Date());

			const id1 = mockSend.mock.calls[0][0].input.Item.id;
			const id2 = mockSend.mock.calls[1][0].input.Item.id;
			expect(id1).not.toBe(id2);
		});

		it("createdAt と updatedAt を設定する", async () => {
			mockSend.mockResolvedValueOnce({});

			const now = new Date("2026-01-28T12:00:00.000Z");
			await recordFinishEvent(mockDdb, "TestEventTable", "env-1", now);

			const callArg = mockSend.mock.calls[0][0];
			expect(callArg.input.Item.createdAt).toBe("2026-01-28T12:00:00.000Z");
			expect(callArg.input.Item.updatedAt).toBe("2026-01-28T12:00:00.000Z");
		});
	});
});

// ============================================================================
// autoFinishIdleEnvironments Tests
// ============================================================================

describe("autoFinishIdleEnvironments", () => {
	const options = { environmentTableName: "EnvTable", eventTableName: "EventTable", thresholdHours: 24 };

	beforeEach(() => vi.clearAllMocks());

	describe("複数 Environment の処理", () => {
		it("アイドル状態の Environment をすべて終了処理する", async () => {
			const now = new Date("2026-01-28T12:00:00.000Z");

			// getActiveEnvironments
			mockSend.mockResolvedValueOnce({
				Items: [
					{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 1 },
					{ id: "env-2", createdAt: "2026-01-26T10:00:00.000Z", ttl: 2 },
				],
				LastEvaluatedKey: undefined,
			});
			// getLatestEventOccurredAt for env-1
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-27T10:00:00.000Z" }] });
			// finishEnvironment for env-1
			mockSend.mockResolvedValueOnce({});
			// recordFinishEvent for env-1
			mockSend.mockResolvedValueOnce({});
			// getLatestEventOccurredAt for env-2
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-27T11:00:00.000Z" }] });
			// finishEnvironment for env-2
			mockSend.mockResolvedValueOnce({});
			// recordFinishEvent for env-2
			mockSend.mockResolvedValueOnce({});

			await autoFinishIdleEnvironments(mockDdb, options, now);

			// 7 calls: scan + (query + update + put) * 2
			expect(mockSend).toHaveBeenCalledTimes(7);
		});

		it("アイドル状態でない Environment は終了処理しない", async () => {
			const now = new Date("2026-01-28T12:00:00.000Z");

			mockSend.mockResolvedValueOnce({
				Items: [
					{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 1 },
					{ id: "env-2", createdAt: "2026-01-28T10:00:00.000Z", ttl: 2 },
				],
				LastEvaluatedKey: undefined,
			});
			// env-1: アイドル
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-27T10:00:00.000Z" }] });
			mockSend.mockResolvedValueOnce({});
			mockSend.mockResolvedValueOnce({});
			// env-2: アクティブ（1時間前）
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-28T11:00:00.000Z" }] });

			await autoFinishIdleEnvironments(mockDdb, options, now);

			// 5 calls: scan + (query + update + put) * 1 + query * 1
			expect(mockSend).toHaveBeenCalledTimes(5);
		});

		it("イベントがない場合は createdAt でアイドル判定する", async () => {
			const now = new Date("2026-01-28T12:00:00.000Z");

			mockSend.mockResolvedValueOnce({
				Items: [{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 1 }],
				LastEvaluatedKey: undefined,
			});
			mockSend.mockResolvedValueOnce({ Items: [] }); // イベントなし
			mockSend.mockResolvedValueOnce({});
			mockSend.mockResolvedValueOnce({});

			await autoFinishIdleEnvironments(mockDdb, options, now);

			// 4 calls: scan + query + update + put
			expect(mockSend).toHaveBeenCalledTimes(4);
		});
	});

	describe("個別エラー時の継続処理", () => {
		it("1件目でエラーが発生しても2件目は処理を継続する", async () => {
			const now = new Date("2026-01-28T12:00:00.000Z");

			mockSend.mockResolvedValueOnce({
				Items: [
					{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 1 },
					{ id: "env-2", createdAt: "2026-01-25T10:00:00.000Z", ttl: 2 },
				],
				LastEvaluatedKey: undefined,
			});
			// env-1
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-27T10:00:00.000Z" }] });
			mockSend.mockRejectedValueOnce(new Error("DB Error")); // エラー
			// env-2
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-27T10:00:00.000Z" }] });
			mockSend.mockResolvedValueOnce({});
			mockSend.mockResolvedValueOnce({});

			await autoFinishIdleEnvironments(mockDdb, options, now);

			// 6 calls: scan + (query + update) + (query + update + put)
			expect(mockSend).toHaveBeenCalledTimes(6);
		});

		it("既に終了済みの場合は recordFinishEvent を呼ばない", async () => {
			const now = new Date("2026-01-28T12:00:00.000Z");

			mockSend.mockResolvedValueOnce({
				Items: [{ id: "env-1", createdAt: "2026-01-25T10:00:00.000Z", ttl: 1 }],
				LastEvaluatedKey: undefined,
			});
			mockSend.mockResolvedValueOnce({ Items: [{ occurredAt: "2026-01-27T10:00:00.000Z" }] });
			mockSend.mockRejectedValueOnce(new ConditionalCheckFailedException({ message: "", $metadata: {} }));

			await autoFinishIdleEnvironments(mockDdb, options, now);

			// 3 calls: scan + query + update (no put because skipped)
			expect(mockSend).toHaveBeenCalledTimes(3);
		});
	});

	describe("空の Environment", () => {
		it("Environment が存在しない場合は何もしない", async () => {
			mockSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });

			await autoFinishIdleEnvironments(mockDdb, options, new Date());

			// 1 call: scan only
			expect(mockSend).toHaveBeenCalledTimes(1);
		});
	});
});
