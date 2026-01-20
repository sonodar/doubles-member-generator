import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted でモック関数を先に作成
const { mockCreate, mockList, mockObserveQuery } = vi.hoisted(() => ({
	mockCreate: vi.fn(),
	mockList: vi.fn(),
	mockObserveQuery: vi.fn(),
}));

// client モジュールのモック
vi.mock("./client", () => ({
	client: {
		models: {
			Event: {
				create: mockCreate,
				list: mockList,
				observeQuery: mockObserveQuery,
			},
		},
	},
}));

// テスト対象のインポートはモック設定後に行う
import { eventEmitter, findAllEvents, subscribeEvent, EventType, replayEvent } from "./event";

describe("event", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("eventEmitter", () => {
		const envId = "test-env-id";

		it("should emit INITIALIZE event with payload", async () => {
			mockCreate.mockResolvedValue({ data: { id: "event-1" } });
			const emitter = eventEmitter(envId);
			const payload = {
				courtCount: 2,
				members: [1, 2, 3, 4],
				histories: [],
				gameCounts: {},
				algorithm: "evenness" as const,
			};

			await emitter.initialize(payload);

			expect(mockCreate).toHaveBeenCalledWith({
				environmentID: envId,
				type: "INITIALIZE",
				payload: JSON.stringify(payload),
				occurredAt: expect.any(String),
			});
		});

		it("should emit JOIN event", async () => {
			mockCreate.mockResolvedValue({ data: { id: "event-1" } });
			const emitter = eventEmitter(envId);

			await emitter.join();

			expect(mockCreate).toHaveBeenCalledWith({
				environmentID: envId,
				type: "JOIN",
				payload: JSON.stringify({}),
				occurredAt: expect.any(String),
			});
		});

		it("should emit LEAVE event with memberId", async () => {
			mockCreate.mockResolvedValue({ data: { id: "event-1" } });
			const emitter = eventEmitter(envId);

			await emitter.leave(5);

			expect(mockCreate).toHaveBeenCalledWith({
				environmentID: envId,
				type: "LEAVE",
				payload: JSON.stringify({ memberId: 5 }),
				occurredAt: expect.any(String),
			});
		});

		it("should emit GENERATE event with members", async () => {
			mockCreate.mockResolvedValue({ data: { id: "event-1" } });
			const emitter = eventEmitter(envId);
			const members = [[1, 2, 3, 4]] as [[number, number, number, number]];

			await emitter.generate(members);

			expect(mockCreate).toHaveBeenCalledWith({
				environmentID: envId,
				type: "GENERATE",
				payload: JSON.stringify({ members }),
				occurredAt: expect.any(String),
			});
		});

		it("should emit RETRY event with members", async () => {
			mockCreate.mockResolvedValue({ data: { id: "event-1" } });
			const emitter = eventEmitter(envId);
			const members = [[1, 2, 3, 4]] as [[number, number, number, number]];

			await emitter.retry(members);

			expect(mockCreate).toHaveBeenCalledWith({
				environmentID: envId,
				type: "RETRY",
				payload: JSON.stringify({ members }),
				occurredAt: expect.any(String),
			});
		});

		it("should emit FINISH event", async () => {
			mockCreate.mockResolvedValue({ data: { id: "event-1" } });
			const emitter = eventEmitter(envId);

			await emitter.finish();

			expect(mockCreate).toHaveBeenCalledWith({
				environmentID: envId,
				type: "FINISH",
				payload: JSON.stringify({}),
				occurredAt: expect.any(String),
			});
		});
	});

	describe("findAllEvents", () => {
		it("should query events by environmentID and return sorted events", async () => {
			const envId = "test-env-id";
			const now = new Date();
			const mockEvents = [
				{
					id: "event-2",
					environmentID: envId,
					type: "JOIN",
					payload: "{}",
					occurredAt: new Date(now.getTime() + 1000).toISOString(),
				},
				{
					id: "event-1",
					environmentID: envId,
					type: "INITIALIZE",
					payload: JSON.stringify({ courtCount: 2 }),
					occurredAt: now.toISOString(),
				},
				{
					id: "event-3",
					environmentID: envId,
					type: "FINISH",
					payload: "{}",
					occurredAt: new Date(now.getTime() + 2000).toISOString(),
				},
			];
			mockList.mockResolvedValue({ data: mockEvents });

			const events = await findAllEvents(envId);

			expect(mockList).toHaveBeenCalledWith({
				filter: { environmentID: { eq: envId } },
			});
			// INITIALIZE が最初、FINISH が最後
			expect(events[0].type).toBe(EventType.Initialize);
			expect(events[events.length - 1].type).toBe(EventType.Finish);
		});

		it("should return empty array when no events", async () => {
			mockList.mockResolvedValue({ data: [] });

			const events = await findAllEvents("no-events");

			expect(events).toEqual([]);
		});
	});

	describe("subscribeEvent", () => {
		it("should subscribe to events with environmentID filter", () => {
			const envId = "test-env-id";
			const handler = vi.fn();
			const mockUnsubscribe = vi.fn();
			const mockSubscribe = vi.fn().mockReturnValue({
				unsubscribe: mockUnsubscribe,
			});
			mockObserveQuery.mockReturnValue({ subscribe: mockSubscribe });

			const subscription = subscribeEvent(envId, handler);

			expect(mockObserveQuery).toHaveBeenCalledWith({
				filter: { environmentID: { eq: envId } },
			});
			expect(mockSubscribe).toHaveBeenCalled();

			subscription.unsubscribe();
			expect(mockUnsubscribe).toHaveBeenCalled();
		});
	});

	describe("replayEvent", () => {
		it("should handle JOIN event", () => {
			const settings = {
				courtCount: 2,
				members: [1, 2, 3, 4],
				histories: [],
				gameCounts: {},
				algorithm: "evenness" as const,
			};
			const event = {
				id: "event-1",
				type: EventType.Join,
				occurredAt: new Date(),
			};

			const result = replayEvent(settings, event as any);

			// join は members に新しいメンバーを追加
			expect(result.members.length).toBe(5);
		});

		it("should handle LEAVE event", () => {
			const settings = {
				courtCount: 2,
				members: [1, 2, 3, 4, 5],
				histories: [],
				gameCounts: {},
				algorithm: "evenness" as const,
			};
			const event = {
				id: "event-1",
				type: EventType.Leave,
				payload: { memberId: 3 },
				occurredAt: new Date(),
			};

			const result = replayEvent(settings, event as any);

			expect(result.members).not.toContain(3);
		});

		it("should handle FINISH event (no change)", () => {
			const settings = {
				courtCount: 2,
				members: [1, 2, 3, 4],
				histories: [],
				gameCounts: {},
				algorithm: "evenness" as const,
			};
			const event = {
				id: "event-1",
				type: EventType.Finish,
				occurredAt: new Date(),
			};

			const result = replayEvent(settings, event as any);

			expect(result).toEqual(settings);
		});
	});
});
