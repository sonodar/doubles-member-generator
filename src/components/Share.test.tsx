import { Algorithms } from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api";
import { render, screen, waitFor } from "../testing/utils";
import Share from "./Share";

// APIモック
vi.mock("../api", async () => {
	const actual = await vi.importActual("../api");
	return {
		...actual,
		findAllEvents: vi.fn(),
		subscribeEvent: vi.fn(() => ({ unsubscribe: vi.fn() })),
	};
});

describe("Share", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本表示", () => {
		it("sharedIdが渡されるとSharedPaneが表示される", async () => {
			// 空のイベントを返す
			vi.mocked(api.findAllEvents).mockResolvedValue([]);

			render(<Share sharedId="test-share-id" />);

			// SharedPaneが読み込まれることを確認（参加者数が表示される）
			await waitFor(() => {
				expect(screen.getByText(/人が参加/)).toBeInTheDocument();
			});
		});
	});

	describe("イベント読み込み", () => {
		it("初期化イベントがある場合、設定が反映される", async () => {
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

			render(<Share sharedId="test-share-id" />);

			await waitFor(() => {
				expect(screen.getByText("8 人が参加中")).toBeInTheDocument();
			});
		});

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

			render(<Share sharedId="test-share-id" />);

			await waitFor(() => {
				expect(screen.getByText("すでに終了しています")).toBeInTheDocument();
			});
		});
	});
});
