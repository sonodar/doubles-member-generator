import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "../../testing/utils";
import { CourtCountInput } from "./CourtCountInput";

describe("CourtCountInput", () => {
	const mockOnChange = vi.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	describe("基本表示", () => {
		it("radiogroup が表示される", () => {
			render(<CourtCountInput value={2} onChange={mockOnChange} />);

			expect(screen.getByRole("radiogroup")).toBeInTheDocument();
		});

		it("1〜4のコート数が選択肢として表示される", () => {
			render(<CourtCountInput value={2} onChange={mockOnChange} />);

			// 各コート数が表示されていることを確認
			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument();
			expect(screen.getByText("3")).toBeInTheDocument();
			expect(screen.getByText("4")).toBeInTheDocument();
		});
	});

	describe("選択状態", () => {
		it("指定されたvalue に対応するラジオが選択状態になる", () => {
			const { container } = render(<CourtCountInput value={3} onChange={mockOnChange} />);

			// value=3 の input が checked
			const checkedRadio = container.querySelector('input[value="3"]') as HTMLInputElement;
			expect(checkedRadio?.checked).toBe(true);
		});
	});
});
