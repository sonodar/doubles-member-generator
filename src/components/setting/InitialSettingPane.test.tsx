import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../testing/utils";
import InitialSettingPane from "./InitialSettingPane";
import { previousSettingsAtom } from "../state";
import { Algorithms, COURT_CAPACITY } from "@logic";

describe("InitialSettingPane", () => {
	const mockOnStart = vi.fn();

	beforeEach(() => {
		mockOnStart.mockClear();
	});

	describe("コート数選択", () => {
		it("コート数選択欄が表示されている", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			// コート数の見出しが表示されていることを確認
			expect(screen.getByRole("heading", { name: "コート数" })).toBeInTheDocument();

			// radiogroup が存在することを確認
			const radiogroups = screen.getAllByRole("radiogroup");
			expect(radiogroups.length).toBeGreaterThan(0);
		});

		it("コート数を変更するとメンバー数の最小値が更新される", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			// 初期状態: 2コート×4人=8人
			const memberCountInput = screen.getByRole("spinbutton");
			expect(memberCountInput).toHaveValue(8);
			expect(memberCountInput).toHaveAttribute("min", "8");
		});
	});

	describe("メンバー数入力", () => {
		it("初期値としてコート数×4人が設定されている", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			// 初期値は2コート×4人=8人
			const memberCountInput = screen.getByRole("spinbutton");
			expect(memberCountInput).toHaveValue(8);
		});

		it("増加ボタンでメンバー数を増やせる", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			const incrementButton = screen.getByRole("button", { name: "increment" });
			fireEvent.click(incrementButton);

			const memberCountInput = screen.getByRole("spinbutton");
			expect(memberCountInput).toHaveValue(9);
		});
	});

	describe("アルゴリズム選択", () => {
		it("初期値として「ばらつき重視」が選択されている", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			const discretenessRadio = screen.getByRole("radio", { name: "ばらつき重視" });
			expect(discretenessRadio).toBeChecked();
		});

		it("「均等性重視」に切り替えられる", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			const evennessRadio = screen.getByRole("radio", { name: "均等性重視" });
			fireEvent.click(evennessRadio);

			expect(evennessRadio).toBeChecked();
		});
	});

	describe("開始ボタン", () => {
		it("開始ボタンが表示されている", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			expect(screen.getByRole("button", { name: "開始" })).toBeInTheDocument();
		});

		it("開始ボタンをクリックすると onStart コールバックが呼ばれる", () => {
			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, null]],
			});

			const startButton = screen.getByRole("button", { name: "開始" });
			fireEvent.click(startButton);

			expect(mockOnStart).toHaveBeenCalledTimes(1);
			expect(mockOnStart).toHaveBeenCalledWith({
				courtCount: 2,
				memberCount: 2 * COURT_CAPACITY,
				algorithm: Algorithms.DISCRETENESS,
			});
		});
	});

	describe("前回設定の復元", () => {
		it("前回の設定がある場合、メンバー数とアルゴリズムが初期値として設定される", async () => {
			const previousSettings = {
				courtCount: 3,
				members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
				histories: [],
				gameCounts: {},
				algorithm: Algorithms.EVENNESS,
			};

			render(<InitialSettingPane onStart={mockOnStart} />, {
				initialAtomValues: [[previousSettingsAtom, previousSettings]],
			});

			// メンバー数12が設定されていることを確認
			const memberCountInput = screen.getByRole("spinbutton");
			expect(memberCountInput).toHaveValue(12);

			// 均等性重視が選択されていることを確認
			const evennessRadio = screen.getByRole("radio", { name: "均等性重視" });
			expect(evennessRadio).toBeChecked();
		});
	});
});
