import { Algorithms, type CourtMembers, type CurrentSettings } from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "../../../testing/utils";
import { AdjustmentDialog } from "./AdjustmentDialog";

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
		it("isOpen=trueでダイアログが表示される", async () => {
			render(<AdjustmentDialog settings={settings} open={true} onClose={mockOnClose} onChange={mockOnChange} />);

			await waitFor(() => expect(screen.getByText("プレイ回数")).toBeInTheDocument());
		});

		it("isOpen=falseでダイアログが表示されない", () => {
			render(<AdjustmentDialog settings={settings} open={false} onClose={mockOnClose} onChange={mockOnChange} />);

			expect(screen.queryByText("プレイ回数")).not.toBeInTheDocument();
		});

		it("AdjustmentPaneが表示される", async () => {
			render(<AdjustmentDialog settings={settings} open={true} onClose={mockOnClose} onChange={mockOnChange} />);

			// 休憩メンバーが表示される（AdjustmentPaneの証拠）
			await waitFor(() => expect(screen.getByText("休憩")).toBeInTheDocument());
		});

		it("MemberCountPaneが表示される", async () => {
			render(<AdjustmentDialog settings={settings} open={true} onClose={mockOnClose} onChange={mockOnChange} />);

			// タブが表示される
			await waitFor(() => expect(screen.getByRole("tab", { name: "総プレイ" })).toBeInTheDocument());
		});
	});

	describe("ボタン操作", () => {
		it("調整反映ボタンをクリックするとonChangeとonCloseが呼ばれる", async () => {
			render(<AdjustmentDialog settings={settings} open={true} onClose={mockOnClose} onChange={mockOnChange} />);

			const button = screen.getByRole("button", { name: /調整反映/ });
			act(() => fireEvent.click(button));

			await waitFor(() => {
				expect(mockOnChange).toHaveBeenCalledTimes(1);
				expect(mockOnClose).toHaveBeenCalledTimes(1);
			});
		});

		it("キャンセルボタンをクリックするとonCloseのみ呼ばれる", async () => {
			render(<AdjustmentDialog settings={settings} open={true} onClose={mockOnClose} onChange={mockOnChange} />);

			const button = screen.getByRole("button", { name: /キャンセル/ });
			act(() => fireEvent.click(button));

			await waitFor(() => {
				expect(mockOnChange).not.toHaveBeenCalled();
				expect(mockOnClose).toHaveBeenCalledTimes(1);
			});
		});
	});
});
