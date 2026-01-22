import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "../../testing/utils";
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
			render(<ResetButton onReset={mockOnReset} disabled={true} />);

			expect(screen.getByRole("button", { name: "メンバー" })).toBeDisabled();
		});
	});

	describe("確認ダイアログ", () => {
		it("クリック時に確認ダイアログが表示される", async () => {
			render(<ResetButton onReset={mockOnReset} />);

			fireEvent.click(screen.getByRole("button", { name: "メンバー" }));

			await waitFor(() => {
				expect(screen.getByText("本当に終了しますか？")).toBeInTheDocument();
			});
		});

		it("確認ダイアログでOKをクリックするとonResetが呼ばれる", async () => {
			render(<ResetButton onReset={mockOnReset} />);

			fireEvent.click(screen.getByRole("button", { name: "メンバー" }));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
			});

			fireEvent.click(screen.getByRole("button", { name: "OK" }));

			await waitFor(() => {
				expect(mockOnReset).toHaveBeenCalledTimes(1);
			});
		});

		it("確認ダイアログでキャンセルをクリックするとonResetは呼ばれない", async () => {
			render(<ResetButton onReset={mockOnReset} />);

			const memberButton = screen.getByRole("button", { name: "メンバー" });
			act(() => fireEvent.click(memberButton));

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
			});

			const cancelButton = screen.getByRole("button", { name: "キャンセル" });
			act(() => fireEvent.click(cancelButton));

			await waitFor(() => {
				expect(mockOnReset).not.toHaveBeenCalled();
			});
		});
	});
});
