import { useCallback, useEffect, useRef } from "react";
import { type Event, findAllEvents, subscribeEvent } from "../api";
import { useBrowserLifecycleSync } from "./useBrowserLifecycleSync";

export interface UseRealtimeSyncOptions {
	/** 共有ID */
	sharedId: string;
	/** イベント受信時のコールバック */
	onEvent: (event: Event) => void;
	/** 全イベント取得後のコールバック */
	onSync: (events: Event[]) => void;
}

export interface UseRealtimeSyncResult {
	/** 手動で sync を実行する */
	sync: () => Promise<void>;
}

/**
 * ブラウザライフサイクルイベントを検知し、subscription の同期と状態回復を行うフック
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions): UseRealtimeSyncResult {
	const { sharedId, onEvent, onSync } = options;

	// マウント状態を追跡する ref
	const mountedRef = useRef(true);

	// subscription 参照
	const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

	// singleflight 用 Promise 参照
	const syncPromiseRef = useRef<Promise<void> | null>(null);

	// 処理済みイベントを管理するオブジェクト参照
	const proceededEventsRef = useRef<Record<string, Event>>({});

	/**
	 * sync 処理
	 * 1. 既存 subscription があれば解除
	 * 2. 新規 subscription を作成
	 * 3. API から全イベントを取得してコールバックに渡す
	 */
	const sync = useCallback((): Promise<void> => {
		// singleflight: 実行中の sync があればそれに合流
		if (syncPromiseRef.current) {
			return syncPromiseRef.current;
		}

		const doSync = async (): Promise<void> => {
			try {
				// アンマウント済みなら何もしない
				if (!mountedRef.current) {
					return;
				}

				// 既存 subscription があれば解除
				if (subscriptionRef.current) {
					subscriptionRef.current.unsubscribe();
					subscriptionRef.current = null;
				}

				// アンマウント済みなら何もしない
				if (!mountedRef.current) {
					return;
				}

				// 新規 subscription を作成
				subscriptionRef.current = subscribeEvent(sharedId, (event: Event) => {
					// 処理済みのイベントなら何もしない
					if (proceededEventsRef.current[event.id]) {
						return;
					}
					proceededEventsRef.current[event.id] = event;
					onEvent(event);
				});

				// アンマウント済みなら subscription 解除して終了
				if (!mountedRef.current) {
					subscriptionRef.current?.unsubscribe();
					subscriptionRef.current = null;
					return;
				}

				// API から全イベントを取得
				const events = await findAllEvents(sharedId);

				// アンマウント済みなら何もしない
				if (!mountedRef.current) {
					return;
				}

				// 取得したイベントを処理済みに記録
				for (const event of events) {
					proceededEventsRef.current[event.id] = event;
				}

				// コールバックに渡す
				onSync(events);
			} catch {
				// エラー時は何もしない（次回イベントで再試行可能）
			} finally {
				// Promise 参照をクリア
				syncPromiseRef.current = null;
			}
		};

		const promise = doSync();
		syncPromiseRef.current = promise;
		return promise;
	}, [sharedId, onEvent, onSync]);

	/**
	 * subscription のみを解除（pagehide 時に呼び出す）
	 * mountedRef は変更しない = 復帰時に sync() が正常動作
	 */
	const unsubscribe = useCallback(() => {
		if (subscriptionRef.current) {
			subscriptionRef.current.unsubscribe();
			subscriptionRef.current = null;
		}
	}, []);

	/**
	 * 完全なクリーンアップ（コンポーネントのアンマウント時のみ）
	 */
	const cleanup = useCallback(() => {
		mountedRef.current = false;
		unsubscribe();
		syncPromiseRef.current = null;
	}, [unsubscribe]);

	// マウント時に sync を実行、アンマウント時に cleanup を実行
	useEffect(() => {
		mountedRef.current = true;
		sync();

		return () => {
			cleanup();
		};
	}, [sync, cleanup]);

	// ブラウザライフサイクルイベントリスナーの登録
	useBrowserLifecycleSync({
		subject: "useRealtimeSync",
		onResume: sync,
		onPause: unsubscribe,
	});

	return { sync };
}
