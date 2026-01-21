import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { ResetButton } from "./ResetButton";

describe("ResetButton", () => {
	const mockOnReset = vi.fn();

	beforeEach(() => {
		mockOnReset.mockClear();
	});

	describe("基本表示", () => {
		it("リセットボタンが表示される", () => {
			render(<ResetButton onReset={mockOnReset} />);

			expect(screen.getByRole("button", { name: "メンバー" })).toBeInTheDocument();
		});

		it("isDisabled=trueの場合、ボタンが無効化される", () => {
			render(<ResetButton onReset={mockOnReset} isDisabled={true} />);

			expect(screen.getByRole("button", { name: "メンバー" })).toBeDisabled();
		});
	});

	describe("確認ダイアログ", () => {
		it("クリック時に確認ダイアログが表示される", () => {
			render(<ResetButton onReset={mockOnReset} />);

			fireEvent.click(screen.getByRole("button", { name: "メンバー" }));

			expect(screen.getByText("本当に終了しますか？")).toBeInTheDocument();
		});

		it("確認ダイアログでOKをクリックするとonResetが呼ばれる", () => {
			render(<ResetButton onReset={mockOnReset} />);

			fireEvent.click(screen.getByRole("button", { name: "メンバー" }));
			fireEvent.click(screen.getByRole("button", { name: "OK" }));

			expect(mockOnReset).toHaveBeenCalledTimes(1);
		});

		it("確認ダイアログでキャンセルをクリックするとonResetは呼ばれない", () => {
			render(<ResetButton onReset={mockOnReset} />);

			fireEvent.click(screen.getByRole("button", { name: "メンバー" }));
			fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

			expect(mockOnReset).not.toHaveBeenCalled();
		});
	});
});
