import { describe, expect, it } from "vitest";
import { render, screen } from "../../testing/utils";
import { AlgorithmBadge } from "./AlgorithmBadge";
import { Algorithms } from "@logic";

describe("AlgorithmBadge", () => {
	describe("アルゴリズム表示", () => {
		it("DISCRETENESSアルゴリズムの場合「ばらつき重視」バッジが表示される", () => {
			render(<AlgorithmBadge algorithm={Algorithms.DISCRETENESS} />);

			expect(screen.getByText("ばらつき重視")).toBeInTheDocument();
		});

		it("EVENNESSアルゴリズムの場合「均等性重視」バッジが表示される", () => {
			render(<AlgorithmBadge algorithm={Algorithms.EVENNESS} />);

			expect(screen.getByText("均等性重視")).toBeInTheDocument();
		});
	});
});
