import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "../../testing/utils";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
	const mockOnCancel = vi.fn();
	const mockOnOk = vi.fn();

	beforeEach(() => {
		mockOnCancel.mockClear();
		mockOnOk.mockClear();
	});

	describe("基本表示", () => {
		it("open=true の場合、ダイアログが表示される", () => {
			render(
				<ConfirmDialog open={true} onCancel={mockOnCancel} onOk={mockOnOk} title="確認">
					確認メッセージ
				</ConfirmDialog>,
			);

			expect(screen.getByText("確認")).toBeInTheDocument();
			expect(screen.getByText("確認メッセージ")).toBeInTheDocument();
		});

		it("isOpen=false の場合、ダイアログが非表示", () => {
			render(
				<ConfirmDialog open={false} onCancel={mockOnCancel} onOk={mockOnOk} title="確認">
					確認メッセージ
				</ConfirmDialog>,
			);

			expect(screen.queryByText("確認メッセージ")).not.toBeInTheDocument();
		});
	});

	describe("ボタン表示", () => {
		it("デフォルトのボタンテキストが表示される", () => {
			render(
				<ConfirmDialog open={true} onCancel={mockOnCancel} onOk={mockOnOk} title="確認">
					確認メッセージ
				</ConfirmDialog>,
			);

			expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
		});

		it("カスタムボタンテキストが表示される", () => {
			render(
				<ConfirmDialog
					open={true}
					onCancel={mockOnCancel}
					onOk={mockOnOk}
					title="確認"
					cancelButtonText="やめる"
					okButtonText="実行"
				>
					確認メッセージ
				</ConfirmDialog>,
			);

			expect(screen.getByRole("button", { name: "やめる" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "実行" })).toBeInTheDocument();
		});
	});

	describe("ボタン操作", () => {
		it("キャンセルボタンをクリックすると onCancel が呼ばれる", () => {
			render(
				<ConfirmDialog open={true} onCancel={mockOnCancel} onOk={mockOnOk} title="確認">
					確認メッセージ
				</ConfirmDialog>,
			);

			fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
			expect(mockOnCancel).toHaveBeenCalledTimes(1);
		});

		it("OKボタンをクリックすると onOk が呼ばれる", () => {
			render(
				<ConfirmDialog open={true} onCancel={mockOnCancel} onOk={mockOnOk} title="確認">
					確認メッセージ
				</ConfirmDialog>,
			);

			fireEvent.click(screen.getByRole("button", { name: "OK" }));
			expect(mockOnOk).toHaveBeenCalledTimes(1);
		});
	});
});
