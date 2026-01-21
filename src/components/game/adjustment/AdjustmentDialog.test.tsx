import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../../testing/utils";
import { AdjustmentDialog } from "./AdjustmentDialog";
import { Algorithms, type CurrentSettings, type CourtMembers } from "@logic";

describe("AdjustmentDialog", () => {
	const mockOnClose = vi.fn();
	const mockOnChange = vi.fn();

	const courtMembers: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];

	const settings: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		histories: [
			{
				members: courtMembers,
				time: "2026-01-21T10:00:00+09:00",
			},
		],
		gameCounts: {
			1: { playCount: 1, baseCount: 0 },
			2: { playCount: 1, baseCount: 0 },
			3: { playCount: 1, baseCount: 0 },
			4: { playCount: 1, baseCount: 0 },
			5: { playCount: 1, baseCount: 0 },
			6: { playCount: 1, baseCount: 0 },
			7: { playCount: 1, baseCount: 0 },
			8: { playCount: 1, baseCount: 0 },
			9: { playCount: 0, baseCount: 0 },
			10: { playCount: 0, baseCount: 0 },
		},
		algorithm: Algorithms.DISCRETENESS,
	};

	beforeEach(() => {
		mockOnClose.mockClear();
		mockOnChange.mockClear();
	});

	describe("基本表示", () => {
		it("isOpen=trueでダイアログが表示される", () => {
			render(<AdjustmentDialog settings={settings} isOpen={true} onClose={mockOnClose} onChange={mockOnChange} />);

			expect(screen.getByText("プレイ回数")).toBeInTheDocument();
		});

		it("isOpen=falseでダイアログが表示されない", () => {
			render(<AdjustmentDialog settings={settings} isOpen={false} onClose={mockOnClose} onChange={mockOnChange} />);

			expect(screen.queryByText("プレイ回数")).not.toBeInTheDocument();
		});

		it("AdjustmentPaneが表示される", () => {
			render(<AdjustmentDialog settings={settings} isOpen={true} onClose={mockOnClose} onChange={mockOnChange} />);

			// 休憩メンバーが表示される（AdjustmentPaneの証拠）
			expect(screen.getByText("休憩")).toBeInTheDocument();
		});

		it("MemberCountPaneが表示される", () => {
			render(<AdjustmentDialog settings={settings} isOpen={true} onClose={mockOnClose} onChange={mockOnChange} />);

			// タブが表示される
			expect(screen.getByRole("tab", { name: "総プレイ" })).toBeInTheDocument();
		});
	});

	describe("ボタン操作", () => {
		it("調整反映ボタンをクリックするとonChangeとonCloseが呼ばれる", () => {
			render(<AdjustmentDialog settings={settings} isOpen={true} onClose={mockOnClose} onChange={mockOnChange} />);

			fireEvent.click(screen.getByRole("button", { name: /調整反映/ }));

			expect(mockOnChange).toHaveBeenCalledTimes(1);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("キャンセルボタンをクリックするとonCloseのみ呼ばれる", () => {
			render(<AdjustmentDialog settings={settings} isOpen={true} onClose={mockOnClose} onChange={mockOnChange} />);

			fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));

			expect(mockOnChange).not.toHaveBeenCalled();
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});
});
