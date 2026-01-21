import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../testing/utils";
import SharedPane from "./SharedPane";
import * as api from "../../api";
import { Algorithms, type CourtMembers } from "@logic";

// APIモック
vi.mock("../../api", async () => {
	const actual = await vi.importActual("../../api");
	return {
		...actual,
		findAllEvents: vi.fn(),
		subscribeEvent: vi.fn(() => ({ unsubscribe: vi.fn() })),
	};
});

describe("SharedPane", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本表示", () => {
		it("参加者数が表示される", async () => {
			vi.mocked(api.findAllEvents).mockResolvedValue([]);

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

			vi.mocked(api.findAllEvents).mockResolvedValue(mockEvents);

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

			vi.mocked(api.findAllEvents).mockResolvedValue(mockEvents);

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

			vi.mocked(api.findAllEvents).mockResolvedValue(mockEvents);

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

			vi.mocked(api.findAllEvents).mockResolvedValue(mockEvents);

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

			vi.mocked(api.findAllEvents).mockResolvedValue(mockEvents);

			render(<SharedPane sharedId="test-id" />);

			await waitFor(() => {
				expect(screen.getByText("今回")).toBeInTheDocument();
			});
		});
	});
});
