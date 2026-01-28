import { atom, useAtomValue } from "jotai";
import { useMemo } from "react";
import { settingsAtom } from "../components/state/atoms";
import { type CurrentSettings, calculateWarningThresholds, detectWarnings, type WarningState } from "../logic";

/**
 * グローバル設定から警告状態を自動計算する派生アトム
 */
export const warningAtom = atom((get): WarningState => {
	const settings = get(settingsAtom);
	const thresholds = calculateWarningThresholds({
		courtCount: settings.courtCount,
		memberCount: settings.members.length,
		algorithm: settings.algorithm,
	});
	return detectWarnings(settings, thresholds);
});

/**
 * グローバル設定の警告状態を取得するフック
 */
export function useWarningState(): WarningState {
	return useAtomValue(warningAtom);
}

/**
 * 任意の設定に対する警告状態を計算するフック（調整画面用）
 * @param settings - 計算対象の設定
 */
export function useWarningStateFor(settings: CurrentSettings): WarningState {
	return useMemo(() => {
		const thresholds = calculateWarningThresholds({
			courtCount: settings.courtCount,
			memberCount: settings.members.length,
			algorithm: settings.algorithm,
		});
		return detectWarnings(settings, thresholds);
	}, [settings]);
}
