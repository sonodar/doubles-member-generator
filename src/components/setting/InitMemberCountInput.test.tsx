import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "../../testing/utils";
import { InitMemberCountInput } from "./InitMemberCountInput";

describe("InitMemberCountInput", () => {
	const mockOnChange = vi.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	describe("基本表示", () => {
		it("数値入力欄が表示される", async () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			const input = screen.getByRole("spinbutton");

			await waitFor(() => {
				expect(input).toBeInTheDocument();
				expect(input).toHaveValue(8);
			});
		});

		it("増減ボタンが表示される", async () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "increment" })).toBeInTheDocument();
				expect(screen.getByRole("button", { name: "decrement" })).toBeInTheDocument();
			});
		});

		it("スライダーが表示される", async () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			await waitFor(() => {
				// Chakra UI v3 の Slider は visibility: hidden を使うため、hidden オプションを指定
				expect(screen.getByRole("slider", { hidden: true })).toBeInTheDocument();
			});
		});
	});

	describe("増減ボタンの動作", () => {
		it("増加ボタンをクリックすると value + 1 で onChange が呼ばれる", async () => {
			render(<InitMemberCountInput min={8} value={10} onChange={mockOnChange} />);

			const incrementButton = screen.getByRole("button", { name: "increment" });
			act(() => fireEvent.click(incrementButton));

			await waitFor(() => {
				expect(mockOnChange).toHaveBeenCalledWith(11);
			});
		});

		it("減少ボタンをクリックすると value - 1 で onChange が呼ばれる", async () => {
			render(<InitMemberCountInput min={8} value={10} onChange={mockOnChange} />);

			const decrementButton = screen.getByRole("button", { name: "decrement" });
			act(() => fireEvent.click(decrementButton));

			await waitFor(() => {
				expect(mockOnChange).toHaveBeenCalledWith(9);
			});
		});
	});

	describe("境界値", () => {
		it("value が min の場合、減少ボタンが無効になる", async () => {
			render(<InitMemberCountInput min={8} value={8} onChange={mockOnChange} />);

			const decrementButton = screen.getByRole("button", { name: "decrement" });
			await waitFor(() => expect(decrementButton).toBeDisabled());
		});

		it("value が min より大きい場合、減少ボタンが有効", async () => {
			render(<InitMemberCountInput min={8} value={10} onChange={mockOnChange} />);

			const decrementButton = screen.getByRole("button", { name: "decrement" });
			await waitFor(() => expect(decrementButton).not.toBeDisabled());
		});
	});
});
