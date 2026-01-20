import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import GamePane from "./GamePane";
import { settingsAtom, shareIdAtom } from "../state";
import { Algorithms, type CurrentSettings } from "@logic";

// API モック
vi.mock("@api", () => ({
	EventType: {
		Join: "JOIN",
		Leave: "LEAVE",
		Generate: "GENERATE",
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
}));

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
		it("メンバー決めボタンをクリックするとモーダルが開く", () => {
			render(<GamePane onReset={mockOnReset} />, {
				initialAtomValues: [
					[settingsAtom, initialSettings],
					[shareIdAtom, ""],
				],
			});

			const generateButton = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(generateButton);

			// モーダルが開くことを確認（メンバー選出見出しが表示される）
			expect(screen.getByText("メンバー選出")).toBeInTheDocument();
		});
	});
});
