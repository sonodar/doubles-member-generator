import { describe, expect, it } from "vitest";
import { StatePresets } from "./statePresets";
import { settingsAtom, previousSettingsAtom } from "@components/state";
import { Algorithms } from "@logic";

describe("StatePresets", () => {
	describe("emptyState", () => {
		it("courtCount=0の初期状態を返す", () => {
			const result = StatePresets.emptyState();

			expect(result).toHaveLength(1);
			const [atom, value] = result[0];
			expect(atom).toBe(settingsAtom);
			expect(value).toMatchObject({
				courtCount: 0,
				members: [],
				histories: [],
			});
		});
	});

	describe("gameInProgress", () => {
		it("ゲーム進行中状態を返す", () => {
			const result = StatePresets.gameInProgress({
				courtCount: 2,
				memberCount: 10,
				historyCount: 1,
			});

			expect(result).toHaveLength(1);
			const [atom, value] = result[0];
			expect(atom).toBe(settingsAtom);
			expect(value).toMatchObject({
				courtCount: 2,
			});
			expect((value as { members: number[] }).members).toHaveLength(10);
			expect((value as { histories: unknown[] }).histories).toHaveLength(1);
		});

		it("アルゴリズムを指定できる", () => {
			const result = StatePresets.gameInProgress({
				courtCount: 2,
				memberCount: 8,
				historyCount: 0,
				algorithm: Algorithms.EVENNESS,
			});

			const [, value] = result[0];
			expect((value as { algorithm: string }).algorithm).toBe(Algorithms.EVENNESS);
		});
	});

	describe("withPreviousSettings", () => {
		it("前回設定ありの状態を返す", () => {
			const previous = {
				courtCount: 3,
				members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
				histories: [],
				gameCounts: {},
				algorithm: Algorithms.DISCRETENESS as const,
			};

			const result = StatePresets.withPreviousSettings(previous);

			expect(result).toHaveLength(2);
			expect(result[0][0]).toBe(settingsAtom);
			expect(result[1][0]).toBe(previousSettingsAtom);
			expect(result[1][1]).toEqual(previous);
		});
	});

	describe("noRestMembers", () => {
		it("休憩メンバーなし状態を返す（メンバー数=コート数×4）", () => {
			const result = StatePresets.noRestMembers(2);

			const [, value] = result[0];
			expect((value as { courtCount: number }).courtCount).toBe(2);
			expect((value as { members: number[] }).members).toHaveLength(8);
		});
	});

	describe("withRestMembers", () => {
		it("休憩メンバーあり状態を返す", () => {
			const result = StatePresets.withRestMembers(2, 2);

			const [, value] = result[0];
			expect((value as { courtCount: number }).courtCount).toBe(2);
			expect((value as { members: number[] }).members).toHaveLength(10);
		});
	});
});
