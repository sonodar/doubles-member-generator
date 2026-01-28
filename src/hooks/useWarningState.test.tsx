import { renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { describe, expect, it } from "vitest";
import { settingsAtom } from "../components/state/atoms";
import { Algorithms, type CurrentSettings } from "../logic";
import { useWarningState, useWarningStateFor } from "./useWarningState";

const createSettings = (overrides: Partial<CurrentSettings> = {}): CurrentSettings => ({
	courtCount: 2,
	members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
	histories: [],
	gameCounts: {},
	algorithm: Algorithms.EVENNESS,
	...overrides,
});

function createWrapper(initialSettings: CurrentSettings) {
	const store = createStore();
	store.set(settingsAtom, initialSettings);
	return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
}

describe("useWarningState", () => {
	it("グローバル設定から警告状態を取得できる", () => {
		const settings = createSettings({
			histories: [
				{
					members: [
						[2, 3, 4, 5],
						[6, 7, 8, 9],
					],
					time: "2024-01-01T10:00:00",
				},
				{
					members: [
						[2, 3, 4, 5],
						[6, 7, 8, 9],
					],
					time: "2024-01-01T10:30:00",
				},
			],
		});

		const { result } = renderHook(() => useWarningState(), {
			wrapper: createWrapper(settings),
		});

		// メンバー1と10は2回連続休憩で警告
		expect(result.current.hasWarnings).toBe(true);
		expect(result.current.warnings.length).toBeGreaterThan(0);
		const member1Warning = result.current.warnings.find((w) => w.memberId === 1 && w.type === "consecutiveRest");
		expect(member1Warning).toBeDefined();
	});

	it("警告がない場合はhasWarningsがfalse", () => {
		const settings = createSettings();

		const { result } = renderHook(() => useWarningState(), {
			wrapper: createWrapper(settings),
		});

		expect(result.current.hasWarnings).toBe(false);
		expect(result.current.warnings).toEqual([]);
	});

	it("閾値情報が含まれる", () => {
		const settings = createSettings();

		const { result } = renderHook(() => useWarningState(), {
			wrapper: createWrapper(settings),
		});

		expect(result.current.thresholds).toBeDefined();
		expect(result.current.thresholds.consecutiveRestThreshold).toBeGreaterThanOrEqual(1);
		expect(result.current.thresholds.playCountDiffThreshold).toBeGreaterThanOrEqual(1);
	});
});

describe("useWarningStateFor", () => {
	it("任意の設定に対する警告状態を計算できる", () => {
		// グローバル設定は警告なし
		const globalSettings = createSettings();

		// 渡す設定は警告あり
		const customSettings = createSettings({
			histories: [
				{
					members: [
						[2, 3, 4, 5],
						[6, 7, 8, 9],
					],
					time: "2024-01-01T10:00:00",
				},
				{
					members: [
						[2, 3, 4, 5],
						[6, 7, 8, 9],
					],
					time: "2024-01-01T10:30:00",
				},
			],
		});

		const { result } = renderHook(() => useWarningStateFor(customSettings), {
			wrapper: createWrapper(globalSettings),
		});

		// customSettings に基づいた警告状態
		expect(result.current.hasWarnings).toBe(true);
	});

	it("設定を変更すると警告状態が再計算される", () => {
		const globalSettings = createSettings();
		const noWarningSettings = createSettings();
		const warningSettings = createSettings({
			histories: [
				{
					members: [
						[2, 3, 4, 5],
						[6, 7, 8, 9],
					],
					time: "2024-01-01T10:00:00",
				},
				{
					members: [
						[2, 3, 4, 5],
						[6, 7, 8, 9],
					],
					time: "2024-01-01T10:30:00",
				},
			],
		});

		const { result, rerender } = renderHook(({ settings }) => useWarningStateFor(settings), {
			wrapper: createWrapper(globalSettings),
			initialProps: { settings: noWarningSettings },
		});

		expect(result.current.hasWarnings).toBe(false);

		// 設定を変更
		rerender({ settings: warningSettings });

		expect(result.current.hasWarnings).toBe(true);
	});

	it("アルゴリズムによって閾値が変わる", () => {
		const globalSettings = createSettings();

		const evennessSettings = createSettings({ algorithm: Algorithms.EVENNESS });
		const discretenessSettings = createSettings({ algorithm: Algorithms.DISCRETENESS });

		const { result: evennessResult } = renderHook(() => useWarningStateFor(evennessSettings), {
			wrapper: createWrapper(globalSettings),
		});

		const { result: discretenessResult } = renderHook(() => useWarningStateFor(discretenessSettings), {
			wrapper: createWrapper(globalSettings),
		});

		// ばらつき重視は閾値が+1される
		expect(discretenessResult.current.thresholds.consecutiveRestThreshold).toBe(
			evennessResult.current.thresholds.consecutiveRestThreshold + 1,
		);
	});
});
