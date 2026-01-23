import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { LeaveDialog } from "./LeaveDialog";

describe("LeaveDialog", () => {
	const mockOnClose = vi.fn();
	const mockOnLeave = vi.fn();
	const members = [1, 2, 3, 4, 5, 6, 7, 8];

	beforeEach(() => {
		mockOnClose.mockClear();
		mockOnLeave.mockClear();
	});

	describe("基本表示", () => {
		it("isOpen=true の場合、ダイアログが表示される", () => {
			render(<LeaveDialog members={members} open={true} onClose={mockOnClose} onLeave={mockOnLeave} />);

			expect(screen.getByRole("combobox")).toBeInTheDocument();
		});

		it("離脱ボタンが表示される", () => {
			render(<LeaveDialog members={members} open={true} onClose={mockOnClose} onLeave={mockOnLeave} />);

			expect(screen.getByRole("button", { name: "離脱" })).toBeInTheDocument();
		});

		it("メンバー一覧がセレクトボックスに表示される", () => {
			render(<LeaveDialog members={members} open={true} onClose={mockOnClose} onLeave={mockOnLeave} />);

			const select = screen.getByRole("combobox");
			expect(select).toBeInTheDocument();

			// オプションが存在することを確認
			const options = screen.getAllByRole("option");
			// placeholder + members.length
			expect(options.length).toBe(members.length + 1);
		});
	});

	describe("メンバー選択と離脱", () => {
		it("メンバーを選択して離脱ボタンをクリックすると onLeave が呼ばれる", () => {
			render(<LeaveDialog members={members} open={true} onClose={mockOnClose} onLeave={mockOnLeave} />);

			// メンバー3を選択
			const select = screen.getByRole("combobox");
			fireEvent.change(select, { target: { value: "3" } });

			// 離脱ボタンをクリック
			const leaveButton = screen.getByRole("button", { name: "離脱" });
			fireEvent.click(leaveButton);

			expect(mockOnLeave).toHaveBeenCalledWith(3);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		it("メンバーを選択せずに離脱ボタンをクリックしても onLeave が呼ばれない", () => {
			render(<LeaveDialog members={members} open={true} onClose={mockOnClose} onLeave={mockOnLeave} />);

			// 離脱ボタンをクリック（選択なし）
			const leaveButton = screen.getByRole("button", { name: "離脱" });
			fireEvent.click(leaveButton);

			expect(mockOnLeave).not.toHaveBeenCalled();
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("非表示", () => {
		it("isOpen=false の場合、ダイアログが非表示", () => {
			render(<LeaveDialog members={members} open={false} onClose={mockOnClose} onLeave={mockOnLeave} />);

			expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
		});
	});
});
