import { Algorithms } from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "../../testing/utils";
import { AlgorithmInput } from "./AlgorithmInput";

describe("AlgorithmInput", () => {
	const mockOnChange = vi.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	describe("基本表示", () => {
		it("ばらつき重視と均等性重視の選択肢が表示される", async () => {
			render(<AlgorithmInput value={Algorithms.DISCRETENESS} onChange={mockOnChange} />);

			await waitFor(() => {
				expect(screen.getByRole("radio", { name: "ばらつき重視" })).toBeInTheDocument();
				expect(screen.getByRole("radio", { name: "均等性重視" })).toBeInTheDocument();
			});
		});
	});

	describe("選択状態", () => {
		it("value=discreteness の場合、ばらつき重視が選択される", async () => {
			render(<AlgorithmInput value={Algorithms.DISCRETENESS} onChange={mockOnChange} />);

			await waitFor(() => {
				const discretenessRadio = screen.getByRole("radio", { name: "ばらつき重視" });
				expect(discretenessRadio).toBeChecked();
			});
		});

		it("value=evenness の場合、均等性重視が選択される", async () => {
			render(<AlgorithmInput value={Algorithms.EVENNESS} onChange={mockOnChange} />);

			await waitFor(() => {
				const evennessRadio = screen.getByRole("radio", { name: "均等性重視" });
				expect(evennessRadio).toBeChecked();
			});
		});
	});

	describe("onChange コールバック", () => {
		it("均等性重視をクリックすると onChange が呼ばれる", async () => {
			render(<AlgorithmInput value={Algorithms.DISCRETENESS} onChange={mockOnChange} />);

			await waitFor(() => {
				expect(screen.getByRole("radio", { name: "均等性重視" })).toBeInTheDocument();
			});

			const evennessRadio = screen.getByRole("radio", { name: "均等性重視" });
			fireEvent.click(evennessRadio);

			await waitFor(() => {
				expect(mockOnChange).toHaveBeenCalledWith(Algorithms.EVENNESS);
			});
		});
	});
});
