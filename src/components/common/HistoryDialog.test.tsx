import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { HistoryDialog } from "./HistoryDialog";
import { settingsAtom } from "../state";
import { Algorithms, type CurrentSettings, type CourtMembers } from "@logic";

describe("HistoryDialog", () => {
	const mockOnClose = vi.fn();

	const courtMembers: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];

	const settingsWithHistory: CurrentSettings = {
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
	};

	beforeEach(() => {
		mockOnClose.mockClear();
	});

	describe("基本表示", () => {
		it("isOpen=trueでダイアログが表示される", () => {
			render(<HistoryDialog isOpen={true} onClose={mockOnClose} />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			expect(screen.getByText("履歴")).toBeInTheDocument();
		});

		it("isOpen=falseでダイアログが表示されない", () => {
			render(<HistoryDialog isOpen={false} onClose={mockOnClose} />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			expect(screen.queryByText("履歴")).not.toBeInTheDocument();
		});
	});

	describe("閉じる操作", () => {
		it("閉じるボタンをクリックするとonCloseが呼ばれる", () => {
			render(<HistoryDialog isOpen={true} onClose={mockOnClose} />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			fireEvent.click(screen.getByRole("button", { name: "Close" }));

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});
});
