import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "../../testing/utils";
import SharedPane from "./SharedPane";
import * as api from "../../api";
import { Algorithms, type CourtMembers } from "@logic";
import { useRealtimeSync } from "../../hooks";
import type { UseRealtimeSyncOptions } from "../../hooks";

// useRealtimeSync のモック
vi.mock("../../hooks", async () => {
	const actual = await vi.importActual("../../hooks");
	return {
		...actual,
		useRealtimeSync: vi.fn(),
	};
});

// APIモック（replayEvent は実際の実装を使う）
vi.mock("../../api", async () => {
	const actual = await vi.importActual("../../api");
	return {
		...actual,
		findAllEvents: vi.fn(),
		subscribeEvent: vi.fn(() => ({ unsubscribe: vi.fn() })),
	};
});

const mockUseRealtimeSync = vi.mocked(useRealtimeSync);

// ヘルパー: useRealtimeSync モックをセットアップ（初回のみ onSync を呼ぶ）
function setupMockWithEvents(events: api.Event[]) {
	let called = false;
	mockUseRealtimeSync.mockImplementation((options: UseRealtimeSyncOptions) => {
		// 初回レンダリング時のみ onSync を呼ぶ（無限ループ防止）
		if (!called) {
			called = true;
			// React の useEffect を模倣するため、次の tick で呼ぶ
			Promise.resolve().then(() => {
				options.onSync(events);
			});
		}
		return { sync: vi.fn() };
	});
}

describe("SharedPane", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("useRealtimeSync フックの統合（Task 2.1）", () => {
		it("useRealtimeSync フックが sharedId とコールバックで呼び出される", () => {
			setupMockWithEvents([]);

			render(<SharedPane sharedId="test-shared-id" />);

			expect(mockUseRealtimeSync).toHaveBeenCalledWith({
				sharedId: "test-shared-id",
				onEvent: expect.any(Function),
				onSync: expect.any(Function),
			});
		});

		it("subscribed state は使用されず、フック内部で管理される", () => {
			setupMockWithEvents([]);

			render(<SharedPane sharedId="test-id" />);

			// subscribeEvent が直接呼ばれないことを確認（フック経由のみ）
			expect(api.subscribeEvent).not.toHaveBeenCalled();
		});

		it("findAllEvents が直接呼ばれないことを確認（フック経由のみ）", () => {
			setupMockWithEvents([]);

			render(<SharedPane sharedId="test-id" />);

			// findAllEvents が直接呼ばれないことを確認
			expect(api.findAllEvents).not.toHaveBeenCalled();
		});
	});

	describe("onSync コールバック（Task 2.1）", () => {
		it("onSync で初期化イベントを受け取ると設定が反映される", async () => {
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("10 人が参加中")).toBeInTheDocument();
			});
		});

		it("onSync で終了イベントを含む場合、終了状態になる", async () => {
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
				{
					id: "event-2",
					type: api.EventType.Finish,
					occurredAt: new Date(),
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("すでに終了しています")).toBeInTheDocument();
			});
		});
	});

	describe("onEvent コールバック（Task 2.1, 2.2）", () => {
		it("onEvent で Generate イベントを受け取ると状態が更新される", async () => {
			const initEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
			];

			let capturedOnEvent: ((event: api.Event) => void) | null = null;
			let called = false;

			mockUseRealtimeSync.mockImplementation((options: UseRealtimeSyncOptions) => {
				capturedOnEvent = options.onEvent;
				if (!called) {
					called = true;
					Promise.resolve().then(() => {
						options.onSync(initEvents);
					});
				}
				return { sync: vi.fn() };
			});

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("8 人が参加中")).toBeInTheDocument();
			});

			// Generate イベントを発火
			const generateEvent: api.Event = {
				id: "event-2",
				type: api.EventType.Generate,
				occurredAt: new Date(),
				payload: {
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
				},
			};

			act(() => {
				capturedOnEvent!(generateEvent);
			});

			// 履歴が更新される
			await waitFor(() => {
				expect(screen.getByText("今回")).toBeInTheDocument();
			});
		});

		it("onEvent で Finish イベントを受け取ると終了状態になる", async () => {
			const initEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
			];

			let capturedOnEvent: ((event: api.Event) => void) | null = null;
			let called = false;

			mockUseRealtimeSync.mockImplementation((options: UseRealtimeSyncOptions) => {
				capturedOnEvent = options.onEvent;
				if (!called) {
					called = true;
					Promise.resolve().then(() => {
						options.onSync(initEvents);
					});
				}
				return { sync: vi.fn() };
			});

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("8 人が参加中")).toBeInTheDocument();
			});

			// Finish イベントを発火
			const finishEvent: api.Event = {
				id: "event-2",
				type: api.EventType.Finish,
				occurredAt: new Date(),
			};

			act(() => {
				capturedOnEvent!(finishEvent);
			});

			await waitFor(() => {
				expect(screen.getByText("すでに終了しています")).toBeInTheDocument();
			});
		});
	});

	describe("基本表示", () => {
		it("参加者数が表示される", async () => {
			setupMockWithEvents([]);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText(/人が参加/)).toBeInTheDocument();
			});
		});
	});

	describe("初期化イベント", () => {
		it("初期化イベントから設定が反映される", async () => {
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("10 人が参加中")).toBeInTheDocument();
			});
		});

		it("アルゴリズムバッジが表示される", async () => {
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("ばらつき重視")).toBeInTheDocument();
			});
		});
	});

	describe("終了状態", () => {
		it("終了イベントがある場合、終了メッセージが表示される", async () => {
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
				{
					id: "event-2",
					type: api.EventType.Finish,
					occurredAt: new Date(),
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("すでに終了しています")).toBeInTheDocument();
			});
		});

		it("終了時はホームボタンが表示される", async () => {
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
				{
					id: "event-2",
					type: api.EventType.Finish,
					occurredAt: new Date(),
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
			});
		});
	});

	describe("履歴表示", () => {
		it("履歴がある場合、HistoryPaneが表示される", async () => {
			const courtMembers: CourtMembers[] = [
				[1, 2, 3, 4],
				[5, 6, 7, 8],
			];
			const mockEvents: api.Event[] = [
				{
					id: "event-1",
					type: api.EventType.Initialize,
					occurredAt: new Date(),
					payload: {
						courtCount: 2,
						members: [1, 2, 3, 4, 5, 6, 7, 8],
						histories: [
							{
								members: courtMembers,
								time: "2026-01-21T10:00:00+09:00",
							},
						],
						gameCounts: {},
						algorithm: Algorithms.DISCRETENESS,
					},
				},
			];

			setupMockWithEvents(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("今回")).toBeInTheDocument();
			});
		});
	});
});
