import { Algorithms, type CurrentSettings } from "@logic";
import * as logic from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "../../testing/utils";
import { GenerateButton } from "./GenerateButton";

describe("GenerateButton", () => {
	const mockOnGenerate = vi.fn();

	const baseSettings: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	beforeEach(() => {
		mockOnGenerate.mockClear();
	});

	describe("基本表示", () => {
		it("メンバー決めボタンが表示される", () => {
			render(<GenerateButton settings={baseSettings} onGenerate={mockOnGenerate} />);

			expect(screen.getByRole("button", { name: "メンバー決め" })).toBeInTheDocument();
		});

		it("ボタンをクリックするとモーダルが開く", async () => {
			render(<GenerateButton settings={baseSettings} onGenerate={mockOnGenerate} />);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(button);

			// モーダルが開いてメンバー選出見出しが表示される
			await waitFor(() => {
				expect(screen.getByText("メンバー選出")).toBeInTheDocument();
			});
		});
	});

	describe("確定とやり直しボタン", () => {
		it("モーダルには確定ボタンとやり直しボタンがある", async () => {
			render(<GenerateButton settings={baseSettings} onGenerate={mockOnGenerate} />);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "確定" })).toBeInTheDocument();
				expect(screen.getByRole("button", { name: "やり直し" })).toBeInTheDocument();
			});
		});

		it("確定ボタンをクリックすると onGenerate が呼ばれる", async () => {
			render(<GenerateButton settings={baseSettings} onGenerate={mockOnGenerate} />);

			// モーダルを開く
			const button = screen.getByRole("button", { name: "メンバー決め" });
			fireEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: "確定" })).toBeInTheDocument();
			});

			// 確定ボタンをクリック
			const okButton = screen.getByRole("button", { name: "確定" });
			fireEvent.click(okButton);

			await waitFor(() => {
				expect(mockOnGenerate).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("無効状態", () => {
		it("isDisabled が true の場合、ボタンが無効になる", () => {
			render(<GenerateButton settings={baseSettings} onGenerate={mockOnGenerate} disabled={true} />);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			expect(button).toBeDisabled();
		});
	});

	describe("アルゴリズム選択", () => {
		it("DISCRETENESSアルゴリズムの設定でgenerate関数が呼ばれる", async () => {
			const generateSpy = vi.spyOn(logic, "generate");
			const discretenessSettings: CurrentSettings = {
				...baseSettings,
				algorithm: Algorithms.DISCRETENESS,
			};

			render(<GenerateButton settings={discretenessSettings} onGenerate={mockOnGenerate} />);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			act(() => fireEvent.click(button));

			await waitFor(() => {
				expect(generateSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						algorithm: Algorithms.DISCRETENESS,
					}),
				);
			});

			generateSpy.mockRestore();
		});

		it("EVENNESSアルゴリズムの設定でgenerate関数が呼ばれる", async () => {
			const generateSpy = vi.spyOn(logic, "generate");
			const evennessSettings: CurrentSettings = {
				...baseSettings,
				algorithm: Algorithms.EVENNESS,
			};

			render(<GenerateButton settings={evennessSettings} onGenerate={mockOnGenerate} />);

			const button = screen.getByRole("button", { name: "メンバー決め" });
			act(() => fireEvent.click(button));

			await waitFor(() => {
				expect(generateSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						algorithm: Algorithms.EVENNESS,
					}),
				);
			});

			generateSpy.mockRestore();
		});
	});
});
