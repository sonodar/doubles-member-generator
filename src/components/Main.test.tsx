import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "../testing/utils";
import Main from "./Main";
import { settingsAtom, emptySettings } from "./state";
import { Algorithms, type CurrentSettings } from "@logic";

describe("Main", () => {
	describe("条件分岐による画面切り替え", () => {
		it("設定が未完了（courtCount === 0）の場合は InitialSettingPane が表示される", async () => {
			render(<Main />, {
				initialAtomValues: [[settingsAtom, emptySettings]],
			});

			// InitialSettingPane のヘッダーが表示されていることを確認
			await waitFor(() => expect(screen.getByRole("heading", { name: "初期設定" })).toBeInTheDocument());
		});

		it("設定完了後（courtCount > 0）は GamePane が表示される", () => {
			const completedSettings: CurrentSettings = {
				courtCount: 2,
				members: [1, 2, 3, 4, 5, 6, 7, 8],
				histories: [],
				gameCounts: {},
				algorithm: Algorithms.DISCRETENESS,
			};

			render(<Main />, {
				initialAtomValues: [[settingsAtom, completedSettings]],
			});

			// GamePane のメンバー決めボタンが表示されていることを確認
			expect(screen.getByRole("button", { name: "メンバー決め" })).toBeInTheDocument();
		});
	});
});
