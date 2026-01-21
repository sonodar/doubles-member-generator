import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { InitMemberCountInput } from "./InitMemberCountInput";

describe("InitMemberCountInput", () => {
	const mockOnChange = vi.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	describe("基本表示", () => {
		it("数値入力欄が表示される", () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			const input = screen.getByRole("spinbutton");
			expect(input).toBeInTheDocument();
			expect(input).toHaveValue(8);
		});

		it("増減ボタンが表示される", () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			expect(screen.getByRole("button", { name: "increment" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "decrement" })).toBeInTheDocument();
		});

		it("スライダーが表示される", () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			expect(screen.getByRole("slider")).toBeInTheDocument();
		});
	});

	describe("増減ボタンの動作", () => {
		it("増加ボタンをクリックすると value + 1 で onChange が呼ばれる", () => {
			render(<InitMemberCountInput min={8} value={10} onChange={mockOnChange} />);

			const incrementButton = screen.getByRole("button", { name: "increment" });
			fireEvent.click(incrementButton);

			expect(mockOnChange).toHaveBeenCalledWith(11);
		});

		it("減少ボタンをクリックすると value - 1 で onChange が呼ばれる", () => {
			render(<InitMemberCountInput min={8} value={10} onChange={mockOnChange} />);

			const decrementButton = screen.getByRole("button", { name: "decrement" });
			fireEvent.click(decrementButton);

			expect(mockOnChange).toHaveBeenCalledWith(9);
		});
	});

	describe("境界値", () => {
		it("value が min の場合、減少ボタンが無効になる", () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			const decrementButton = screen.getByRole("button", { name: "decrement" });
			expect(decrementButton).toBeDisabled();
		});

		it("value が min より大きい場合、減少ボタンが有効", () => {
			render(<InitMemberCountInput min={8} value={10} onChange={mockOnChange} />);

			const decrementButton = screen.getByRole("button", { name: "decrement" });
			expect(decrementButton).not.toBeDisabled();
		});
	});
});
