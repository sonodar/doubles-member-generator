import { useEffect, useRef } from "react";

export interface UseBrowserLifecycleSyncOptions {
	/** ログ出力時に使用する識別子 */
	subject: string;
	/** ブラウザが復帰した時に呼ばれるコールバック（visibilitychange visible, pageshow persisted, online） */
	onResume: () => void;
	/** ブラウザが非アクティブになった時に呼ばれるコールバック（pagehide） */
	onPause: () => void;
}

/**
 * ブラウザライフサイクルイベントを監視し、適切なタイミングで
 * onResume/onPause コールバックを呼び出すフック
 *
 * 監視するイベント:
 * - visibilitychange (visible) → onResume
 * - pageshow (persisted=true) → onResume（bfcache復帰）
 * - pagehide → onPause
 * - online → onResume
 */
export function useBrowserLifecycleSync(options: UseBrowserLifecycleSyncOptions): void {
	const { subject } = options;

	// コールバックの最新の参照を保持する ref
	const onResumeRef = useRef(options.onResume);
	const onPauseRef = useRef(options.onPause);

	// コールバックが変更されたら ref を更新
	useEffect(() => {
		onResumeRef.current = options.onResume;
		onPauseRef.current = options.onPause;
	}, [options.onResume, options.onPause]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				console.log(`[${subject}] resume (visibilitychange: visible)`);
				onResumeRef.current();
			}
		};

		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				console.log(`[${subject}] resume (pageshow: persisted)`);
				onResumeRef.current();
			}
		};

		const handlePageHide = () => {
			console.log(`[${subject}] pause (pagehide)`);
			onPauseRef.current();
		};

		const handleOnline = () => {
			console.log(`[${subject}] resume (online)`);
			onResumeRef.current();
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("pageshow", handlePageShow);
		window.addEventListener("pagehide", handlePageHide);
		window.addEventListener("online", handleOnline);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("pageshow", handlePageShow);
			window.removeEventListener("pagehide", handlePageHide);
			window.removeEventListener("online", handleOnline);
		};
	}, [subject]);
}
