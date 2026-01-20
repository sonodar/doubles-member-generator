import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import { GenerateButton } from "./GenerateButton";
import { Algorithms, type CurrentSettings } from "@logic";

describe("GenerateButton", () => {
	const mockOnGenerate = vi.fn();
	const mockOnIgnoreUsageAlert = vi.fn();

	const baseSettings: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	beforeEach(() => {
		mockOnGenerate.mockClear();
		mockOnIgnoreUsageAlert.mockClear();
	});

	describe("基本表示", () => {
		it("メンバー決めボタンが表示される", () => {
			render(
				<GenerateButton
					settings={baseSettings}
					onGenerate={mockOnGenerate}
					onIgnoreUsageAlert={mockOnIgnoreUsageAlert}
				/>,
			);

			expect(screen.getByRole("button", { name: "メンバー決め" })).toBeInTheDocument();
		});

		it("ボタンをクリックするとモーダルが開く", () => {
			render(
				<GenerateButton
					settings={baseSettings}
					onGenerate={mockOnGenerate}
					onIgnoreUsageAlert={mockOnIgnoreUsageAlert}
				/>,
			);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(button);

			// モーダルが開いてメンバー選出見出しが表示される
			expect(screen.getByText("メンバー選出")).toBeInTheDocument();
		});
	});

	describe("確定とやり直しボタン", () => {
		it("モーダルには確定ボタンとやり直しボタンがある", () => {
			render(
				<GenerateButton
					settings={baseSettings}
					onGenerate={mockOnGenerate}
					onIgnoreUsageAlert={mockOnIgnoreUsageAlert}
				/>,
			);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(button);

			expect(screen.getByRole("button", { name: "確定" })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: "やり直し" })).toBeInTheDocument();
		});

		it("確定ボタンをクリックすると onGenerate が呼ばれる", () => {
			render(
				<GenerateButton
					settings={baseSettings}
					onGenerate={mockOnGenerate}
					onIgnoreUsageAlert={mockOnIgnoreUsageAlert}
				/>,
			);

			// モーダルを開く
			const button = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(button);

			// 確定ボタンをクリック
			const okButton = screen.getByRole("button", { name: "確定" });
			fireEvent.click(okButton);

			expect(mockOnGenerate).toHaveBeenCalledTimes(1);
		});
	});

	describe("無効状態", () => {
		it("isDisabled が true の場合、ボタンが無効になる", () => {
			render(
				<GenerateButton
					settings={baseSettings}
					onGenerate={mockOnGenerate}
					onIgnoreUsageAlert={mockOnIgnoreUsageAlert}
					isDisabled={true}
				/>,
			);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			expect(button).toBeDisabled();
		});
	});
});
