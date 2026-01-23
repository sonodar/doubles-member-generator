import { Algorithms, type CurrentSettings } from "@logic";
import { useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";
import { settingsReducer } from "./reducer";
import { useReducerAtom } from "./useReducerAtom";

export const emptySettings: CurrentSettings = {
	courtCount: 0,
	members: [],
	histories: [],
	gameCounts: {},
	algorithm: Algorithms.DISCRETENESS,
};

// const onBoardingAtom = atomWithStorage("onBoarding", { step: 0 });
export const settingsAtom = atomWithStorage("currentSettings", emptySettings);
// getOnInit: true で同期的に localStorage から取得する
// 非同期だと初期値で一度レンダリングされた後に localStorage の値で再レンダリングされ、画面がちらつく
export const previousSettingsAtom = atomWithStorage<CurrentSettings | null>("previousSettings", null, undefined, {
	getOnInit: true,
});
export const shareIdAtom = atomWithStorage("shareId", "");

export function useResetAll() {
	const setSettings = useSetAtom(settingsAtom);
	const setShareId = useSetAtom(shareIdAtom);
	return () => {
		setSettings(RESET);
		setShareId(RESET);
	};
}

export const useSettings = () => useAtomValue(settingsAtom);
export const useSettingsReducer = () => useReducerAtom(settingsAtom, settingsReducer);
