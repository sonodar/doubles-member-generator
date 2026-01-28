import type { History } from "./types";

/**
 * 連続操作判定の閾値（ミリ秒）
 */
export const CONSECUTIVE_THRESHOLD_MS = 60 * 1000; // 1分

/**
 * 履歴から連続操作かどうかを判定する
 * @param histories - 履歴配列
 * @param now - 現在時刻（テスト用にオプショナル）
 * @returns 連続操作の場合 true
 */
export function isConsecutiveOperation(histories: History[], now: Date = new Date()): boolean {
	if (histories.length === 0) {
		return false;
	}

	const latestHistory = histories[histories.length - 1];
	const latestTime = Date.parse(latestHistory.time);

	// 日付パース失敗時は安全側に倒し false を返す
	if (Number.isNaN(latestTime)) {
		return false;
	}

	const elapsed = now.getTime() - latestTime;
	return elapsed < CONSECUTIVE_THRESHOLD_MS;
}
