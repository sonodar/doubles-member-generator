import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { UsageAlertDialog } from "./UsageAlertDialog";
import { settingsAtom } from "../state";
import { Algorithms, type CurrentSettings } from "@logic";

describe("UsageAlertDialog", () => {
	const mockOnClose = vi.fn();
	const mockOnDismiss = vi.fn();

	const baseSettings: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	beforeEach(() => {
		mockOnClose.mockClear();
		mockOnDismiss.mockClear();
	});

	describe("基本表示", () => {
		it("isOpen=trueでアラートダイアログが表示される", () => {
			render(<UsageAlertDialog open={true} onClose={mockOnClose} onDismiss={mockOnDismiss} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			expect(screen.getByText("不適切な使い方です")).toBeInTheDocument();
		});

		it("isOpen=falseでアラートダイアログが表示されない", () => {
			render(<UsageAlertDialog open={false} onClose={mockOnClose} onDismiss={mockOnDismiss} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			expect(screen.queryByText("不適切な使い方です")).not.toBeInTheDocument();
		});
	});

	describe("ボタン操作", () => {
		it("「組み合わせ決定をやめる」ボタンをクリックするとonCloseが呼ばれる", () => {
			render(<UsageAlertDialog open={true} onClose={mockOnClose} onDismiss={mockOnDismiss} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			fireEvent.click(screen.getByRole("button", { name: "組み合わせ決定をやめる" }));

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("「テスト目的のため〜」ボタンをクリックするとonDismissとonCloseが呼ばれる", () => {
			render(<UsageAlertDialog open={true} onClose={mockOnClose} onDismiss={mockOnDismiss} />, {
				initialAtomValues: [[settingsAtom, baseSettings]],
			});

			fireEvent.click(screen.getByRole("button", { name: /テスト目的/ }));

			expect(mockOnDismiss).toHaveBeenCalledTimes(1);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("不公平警告メッセージ", () => {
		it("不公平な状態の場合、警告メッセージが表示される", () => {
			// 休憩メンバーが多い場合は不公平になりやすい
			const unfairSettings: CurrentSettings = {
				...baseSettings,
				members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			};

			render(<UsageAlertDialog open={true} onClose={mockOnClose} onDismiss={mockOnDismiss} />, {
				initialAtomValues: [[settingsAtom, unfairSettings]],
			});

			expect(screen.getByText(/公平性が保証できなくなる/)).toBeInTheDocument();
		});
	});
});
