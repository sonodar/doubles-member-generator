import { COURT_CAPACITY } from "./consts";
import type { Algorithm, CurrentSettings } from "./types";
import { Algorithms } from "./types";
import { getContinuousRestCount, getLatestMembers, getRestMembers } from "./util";

/** 警告閾値 */
export type WarningThresholds = {
	/** 連続休憩警告の閾値 */
	consecutiveRestThreshold: number;
	/** 試合回数差警告の閾値 */
	playCountDiffThreshold: number;
};

/** 警告の種類 */
export type WarningType = "consecutiveRest" | "playCountDiff";

/** メンバーごとの警告状態 */
export type MemberWarning = {
	memberId: number;
	type: WarningType;
	value: number;
	threshold: number;
};

/** 全体の警告状態 */
export type WarningState = {
	thresholds: WarningThresholds;
	warnings: MemberWarning[];
	hasWarnings: boolean;
};

/** 閾値計算の入力パラメータ */
export type ThresholdParams = {
	courtCount: number;
	memberCount: number;
	algorithm: Algorithm;
};

/**
 * 警告閾値を計算する
 *
 * ## 数学モデル
 *
 * ### 確率論的アプローチ
 * 完全にランダムに休憩者を選ぶ場合、特定のメンバーが休憩する確率:
 *   p = r / n  (r: 休憩人数, n: メンバー数)
 *
 * 特定のメンバーが k 回連続で休憩する確率（独立と仮定）:
 *   P(連続休憩 ≥ k) ≈ p^k
 *
 * ### 閾値の導出
 * 「通常では起こりにくい」= 確率が有意水準 α 以下
 *   p^k ≤ α
 *
 * 対数を取ると:
 *   k ≥ ln(α) / ln(p)
 *
 * よって基本閾値:
 *   k = ceil(ln(α) / ln(r/n))
 *
 * ここで α = 0.1 (10%) をデフォルトの有意水準とする。
 *
 * ### 計算ロジック
 * 1. 休憩人数 r = メンバー数 - コート数 × 4
 * 2. 休憩確率 p = r / n
 * 3. 基本閾値 = max(1, ceil(ln(0.1) / ln(p)))
 * 4. アルゴリズム補正:
 *    - ばらつき重視（discreteness）: 基本閾値 + 1（緩い基準）
 *    - 均等性重視（evenness）: 基本閾値そのまま（厳しい基準）
 * 5. 休憩人数が0以下の場合: 閾値 = Infinity（警告なし）
 */
export function calculateWarningThresholds(params: ThresholdParams): WarningThresholds {
	const { courtCount, memberCount, algorithm } = params;

	// 休憩人数を計算
	const restCount = memberCount - courtCount * COURT_CAPACITY;

	// 休憩人数が0以下の場合、警告は発生しない
	if (restCount <= 0) {
		return {
			consecutiveRestThreshold: Number.POSITIVE_INFINITY,
			playCountDiffThreshold: Number.POSITIVE_INFINITY,
		};
	}

	// 休憩確率を計算
	const restProbability = restCount / memberCount;

	// 有意水準（10%）
	const alpha = 0.1;

	// 基本閾値を計算: ceil(ln(α) / ln(p))
	const baseThreshold = Math.max(1, Math.ceil(Math.log(alpha) / Math.log(restProbability)));

	// アルゴリズム補正
	const algorithmBonus = algorithm === Algorithms.DISCRETENESS ? 1 : 0;

	const threshold = baseThreshold + algorithmBonus;

	return {
		consecutiveRestThreshold: threshold,
		playCountDiffThreshold: threshold,
	};
}

/**
 * 警告状態を検出する
 *
 * 検出ロジック:
 * 1. 連続休憩警告:
 *    - 各メンバーの連続休憩回数を getContinuousRestCount で取得
 *    - 連続休憩回数 >= consecutiveRestThreshold のメンバーを警告
 * 2. 試合回数差警告:
 *    - 各メンバーの試合回数（補正値適用後）を取得
 *    - 最大値 - 最小値 >= playCountDiffThreshold の場合
 *    - 最小値のメンバーを警告
 */
export function detectWarnings(settings: CurrentSettings, thresholds: WarningThresholds): WarningState {
	const warnings: MemberWarning[] = [];

	// 連続休憩警告の検出
	const lastMembers = getLatestMembers({ histories: settings.histories });
	if (lastMembers) {
		const restMembers = getRestMembers({ members: settings.members }, lastMembers);
		for (const memberId of restMembers) {
			const joinedAt = settings.gameCounts[memberId]?.joinedAt ?? 0;
			const count = getContinuousRestCount(settings.histories, memberId, joinedAt);
			if (count >= thresholds.consecutiveRestThreshold) {
				warnings.push({
					memberId,
					type: "consecutiveRest",
					value: count,
					threshold: thresholds.consecutiveRestThreshold,
				});
			}
		}
	}

	// 試合回数差警告の検出
	const playCounts = settings.members.map((memberId) => {
		const count = settings.gameCounts[memberId];
		// 補正値を加算した実質的なプレイ回数
		return {
			memberId,
			effectivePlayCount: (count?.playCount ?? 0) + (count?.baseCount ?? 0),
		};
	});

	if (playCounts.length > 0) {
		const maxPlayCount = Math.max(...playCounts.map((p) => p.effectivePlayCount));
		const minPlayCount = Math.min(...playCounts.map((p) => p.effectivePlayCount));
		const diff = maxPlayCount - minPlayCount;

		if (diff >= thresholds.playCountDiffThreshold) {
			// 最少のメンバーを警告対象とする
			const minMembers = playCounts.filter((p) => p.effectivePlayCount === minPlayCount);
			for (const { memberId, effectivePlayCount } of minMembers) {
				warnings.push({
					memberId,
					type: "playCountDiff",
					value: effectivePlayCount,
					threshold: thresholds.playCountDiffThreshold,
				});
			}
		}
	}

	return {
		thresholds,
		warnings,
		hasWarnings: warnings.length > 0,
	};
}
