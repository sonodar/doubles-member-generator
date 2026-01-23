import { Algorithms, type CurrentSettings } from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "../../testing/utils";
import { settingsAtom } from "../state";
import { CurrentMemberCountInput } from "./CurrentMemberCountInput";

describe("CurrentMemberCountInput", () => {
	const mockOnIncrement = vi.fn();
	const mockOnDecrement = vi.fn();

	const baseSettings: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	beforeEach(() => {
		mockOnIncrement.mockClear();
		mockOnDecrement.mockClear();
	});

	describe("基本表示", () => {
		it("現在のメンバー数が表示される", () => {
			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			expect(screen.getByText("現在")).toBeInTheDocument();
			expect(screen.getByDisplayValue("10")).toBeInTheDocument();
			expect(screen.getByText("人")).toBeInTheDocument();
		});

		it("参加ボタンが表示される", () => {
			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			expect(screen.getByRole("button", { name: /参加/ })).toBeInTheDocument();
		});

		it("離脱ボタンが表示される", () => {
			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			expect(screen.getByRole("button", { name: /離脱/ })).toBeInTheDocument();
		});
	});

	describe("参加ボタン", () => {
		it("参加ボタンをクリックするとonIncrementが呼ばれる", () => {
			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			fireEvent.click(screen.getByRole("button", { name: /参加/ }));

			expect(mockOnIncrement).toHaveBeenCalledTimes(1);
		});

		it("isDisabled=trueの場合、参加ボタンが無効になる", () => {
			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} disabled={true} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			expect(screen.getByRole("button", { name: /参加/ })).toBeDisabled();
		});
	});

	describe("離脱ボタン", () => {
		it("離脱ボタンをクリックするとダイアログが表示される", async () => {
			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			fireEvent.click(screen.getByRole("button", { name: /離脱/ }));

			// LeaveDialog が表示される（番号選択のセレクトボックス）
			await waitFor(() => {
				expect(screen.getByText("離脱する番号")).toBeInTheDocument();
			});
		});

		it("メンバー数が最小値の場合、離脱ボタンが無効になる", () => {
			// コート数2 × 4 = 8人が最小
			const minSettings: CurrentSettings = {
				...baseSettings,
				members: [1, 2, 3, 4, 5, 6, 7, 8],
			};

			render(<CurrentMemberCountInput onIncrement={mockOnIncrement} onDecrement={mockOnDecrement} />, {
				initialAtomValues: [[settingsAtom, minSettings]],
			});

			expect(screen.getByRole("button", { name: /離脱/ })).toBeDisabled();
		});
	});
});
