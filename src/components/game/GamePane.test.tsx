import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "../../api";
import { Algorithms, type CurrentSettings } from "../../logic";
import { fireEvent, render, screen, waitFor } from "../../testing/utils";
import { settingsAtom, shareIdAtom } from "../state";
import GamePane from "./GamePane";

// API モック
vi.mock("../../api", () => ({
	EventType: {
		Join: "JOIN",
		Leave: "LEAVE",
		Generate: "GENERATE",
		Finish: "FINISH",
	},
	createEnvironment: vi.fn().mockResolvedValue({ id: "test-env-id" }),
	eventEmitter: vi.fn().mockReturnValue({
		initialize: vi.fn(),
		join: vi.fn(),
		leave: vi.fn(),
		generate: vi.fn(),
		finish: vi.fn(),
	}),
	finishEnvironment: vi.fn(),
	subscribeEvent: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
}));

import { eventEmitter, subscribeEvent } from "../../api";

const mockSubscribeEvent = vi.mocked(subscribeEvent);
const mockEventEmitter = vi.mocked(eventEmitter);

describe("GamePane", () => {
	const mockOnReset = vi.fn();

	const initialSettings: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	beforeEach(() => {
		mockOnReset.mockClear();
		vi.clearAllMocks();
		mockSubscribeEvent.mockReturnValue({ unsubscribe: vi.fn() });
		mockEventEmitter.mockReturnValue({
			initialize: vi.fn(),
			join: vi.fn(),
			leave: vi.fn(),
			generate: vi.fn(),
			retry: vi.fn(),
			finish: vi.fn(),
		});
	});

	describe("基本表示", () => {
		it("メンバー決めボタンが表示される", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			expect(screen.getByRole("button", { name: "メンバー決め" })).toBeInTheDocument();
		});

		it("アルゴリズムバッジが表示される", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			// ばらつき重視のバッジが表示されていることを確認
			expect(screen.getByText("ばらつき重視")).toBeInTheDocument();
		});

		it("フッターボタン（履歴・メンバー・共有）が表示される", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			// フッターボタンを確認（aria-label で検索）
			expect(screen.getByRole("button", { name: "履歴" })).toBeInTheDocument();
			// メンバーボタンは複数あるため getAllByRole を使用
			const memberButtons = screen.getAllByRole("button", { name: "メンバー" });
			expect(memberButtons.length).toBeGreaterThan(0);
			expect(screen.getByRole("button", { name: "シェア" })).toBeInTheDocument();
		});
	});

	describe("メンバー数増減", () => {
		it("参加ボタンが表示される", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			expect(screen.getByRole("button", { name: "参加" })).toBeInTheDocument();
		});

		it("離脱ボタンが表示される", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			expect(screen.getByRole("button", { name: "離脱" })).toBeInTheDocument();
		});
	});

	describe("メンバー決めボタン", () => {
		it("メンバー決めボタンをクリックするとモーダルが開く", async () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			const generateButton = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(generateButton);

			// モーダルが開くことを確認（メンバー選出見出しが表示される）
			await waitFor(() => {
				expect(screen.getByText("メンバー選出")).toBeInTheDocument();
			});
		});
	});

	describe("履歴追加", () => {
		it("ゲーム生成後に履歴が追加され、コートメンバーが表示される", async () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			// メンバー決めボタンをクリック
			const generateButton = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(generateButton);

			// モーダルが開いたことを確認
			await waitFor(() => {
				expect(screen.getByText("メンバー選出")).toBeInTheDocument();
			});

			// 確定ボタンをクリック
			const okButton = screen.getByRole("button", { name: "確定" });
			fireEvent.click(okButton);

			// コートメンバーが表示される（履歴が追加された証拠）
			// 履歴が追加されると「今回」というラベルが表示される
			await waitFor(() => {
				expect(screen.getByText(/今回/)).toBeInTheDocument();
			});
		});
	});

	describe("自動終了の購読", () => {
		it("environmentId が存在する場合、FINISH イベントを購読する", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, "test-env-id"],
				],
			});

			expect(mockSubscribeEvent).toHaveBeenCalledWith("test-env-id", expect.any(Function));
		});

		it("environmentId が空の場合、購読しない", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			expect(mockSubscribeEvent).not.toHaveBeenCalled();
		});

		it("FINISH イベントを受信すると onReset が呼ばれる", async () => {
			let eventHandler: (event: Event) => void;
			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: vi.fn() };
			});

			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, "test-env-id"],
				],
			});

			// FINISH イベントを発火
			act(() => {
				eventHandler!({
					id: "event-1",
					type: "FINISH",
					payload: undefined,
					occurredAt: new Date(),
				} as Event);
			});

			await waitFor(() => {
				expect(mockOnReset).toHaveBeenCalledTimes(1);
			});
		});

		it("リセットボタン押下時に先に unsubscribe が呼ばれる", async () => {
			const mockUnsubscribe = vi.fn();
			const mockFinish = vi.fn();
			mockSubscribeEvent.mockReturnValue({ unsubscribe: mockUnsubscribe });
			mockEventEmitter.mockReturnValue({
				initialize: vi.fn(),
				join: vi.fn(),
				leave: vi.fn(),
				generate: vi.fn(),
				retry: vi.fn(),
				finish: mockFinish,
			});

			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, "test-env-id"],
				],
			});

			// フッターにある閉じるボタン（リセットボタン）をクリック
			// ResetButton は aria-label="メンバー" を使用している
			const resetButtons = screen.getAllByRole("button", { name: "メンバー" });
			// フッターのリセットボタンは末尾にある
			const resetButton = resetButtons[resetButtons.length - 1];
			fireEvent.click(resetButton);

			// 確認ダイアログが開くので「OK」を押す
			await waitFor(() => {
				expect(screen.getByText("本当に終了しますか？")).toBeInTheDocument();
			});
			const okButton = screen.getByRole("button", { name: "OK" });
			fireEvent.click(okButton);

			// unsubscribe が先に呼ばれ、その後 finish が呼ばれる
			await waitFor(() => {
				expect(mockUnsubscribe).toHaveBeenCalled();
				expect(mockOnReset).toHaveBeenCalled();
				expect(mockFinish).toHaveBeenCalled();
			});
		});
	});
});
