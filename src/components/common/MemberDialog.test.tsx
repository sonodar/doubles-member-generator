import { Algorithms, type CourtMembers, type CurrentSettings } from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "../../testing/utils";
import { MemberDialog } from "./MemberDialog";

describe("MemberDialog", () => {
	const mockOnClose = vi.fn();

	const courtMembers: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];

	const settingsWithHistory: CurrentSettings = {
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
	});

	describe("基本表示", () => {
		it("isOpen=trueでダイアログが表示される", async () => {
			render(<MemberDialog settings={settingsWithHistory} open={true} onClose={mockOnClose} />);

			await waitFor(() => {
				expect(screen.getByText("プレイ回数・休憩回数")).toBeInTheDocument();
			});
		});

		it("isOpen=falseでダイアログが表示されない", () => {
			render(<MemberDialog settings={settingsWithHistory} open={false} onClose={mockOnClose} />);

			expect(screen.queryByText("プレイ回数・休憩回数")).not.toBeInTheDocument();
		});
	});

	describe("MemberCountPaneの表示", () => {
		it("メンバー情報が表示される", async () => {
			render(<MemberDialog settings={settingsWithHistory} open={true} onClose={mockOnClose} />);

			// MemberCountPane のタブが表示される
			await waitFor(() => {
				expect(screen.getByRole("tab", { name: "総プレイ" })).toBeInTheDocument();
			});
		});
	});

	describe("閉じる操作", () => {
		it("閉じるボタンをクリックするとonCloseが呼ばれる", async () => {
			render(<MemberDialog settings={settingsWithHistory} open={true} onClose={mockOnClose} />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
			});

			fireEvent.click(screen.getByRole("button", { name: "Close" }));

			await waitFor(() => {
				expect(mockOnClose).toHaveBeenCalledTimes(1);
			});
		});
	});
});
