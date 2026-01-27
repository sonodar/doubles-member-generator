import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";
import { atomFamily } from "jotai-family";
import { Algorithms, type CurrentSettings } from "../../logic";
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

// Push Subscription 状態管理
// environmentId ごとに購読状態を永続化
const pushSubscriptionAtomFamily = atomFamily((environmentId: string) =>
	atomWithStorage<boolean>(`pushSubscription:${environmentId}`, false, undefined, {
		getOnInit: true,
	}),
);

export function usePushSubscriptionState(environmentId: string) {
	return useAtom(pushSubscriptionAtomFamily(environmentId));
}
