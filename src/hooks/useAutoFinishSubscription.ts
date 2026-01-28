import { useCallback, useEffect, useRef } from "react";
import { type Event, EventType, subscribeEvent } from "../api";
import { useBrowserLifecycleSync } from "./useBrowserLifecycleSync";

export interface UseAutoFinishSubscriptionOptions {
	/** 環境ID（null の場合は購読しない） */
	environmentId: string | null;
	/** 自動終了イベント受信時のコールバック */
	onAutoFinish: () => void;
}

export interface UseAutoFinishSubscriptionResult {
	/** 購読を解除する */
	unsubscribe: () => void;
}

/**
 * 自動終了（FINISH）イベントを購読するフック
 *
 * Lambda の autoFinisher が idle 状態の Environment を終了した際に
 * 発行される FINISH イベントを検知し、運営画面をリセットする
 */
export function useAutoFinishSubscription(options: UseAutoFinishSubscriptionOptions): UseAutoFinishSubscriptionResult {
	const { environmentId, onAutoFinish } = options;

	// subscription 参照
	const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

	// マウント状態を追跡する ref
	const mountedRef = useRef(true);

	/**
	 * 購読を解除する
	 */
	const unsubscribe = useCallback(() => {
		if (subscriptionRef.current) {
			subscriptionRef.current.unsubscribe();
			subscriptionRef.current = null;
		}
	}, []);

	/**
	 * 購読を開始する
	 */
	const subscribe = useCallback(() => {
		// environmentId がない場合は購読しない
		if (!environmentId) {
			return;
		}

		// 既存の購読があれば解除
		unsubscribe();

		// FINISH イベントを購読
		subscriptionRef.current = subscribeEvent(environmentId, (event: Event) => {
			// マウント解除済みなら何もしない
			if (!mountedRef.current) {
				return;
			}

			// FINISH イベントの場合のみコールバックを呼び出す
			if (event.type === EventType.Finish) {
				onAutoFinish();
			}
		});
	}, [environmentId, onAutoFinish, unsubscribe]);

	// environmentId が変わったら購読を再設定
	useEffect(() => {
		mountedRef.current = true;
		subscribe();

		return () => {
			mountedRef.current = false;
			unsubscribe();
		};
	}, [subscribe, unsubscribe]);

	// ブラウザライフサイクルイベントリスナーの登録
	useBrowserLifecycleSync({
		subject: "useAutoFinishSubscription",
		onResume: subscribe,
		onPause: unsubscribe,
	});

	return { unsubscribe };
}
