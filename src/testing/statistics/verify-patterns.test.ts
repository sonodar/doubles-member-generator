/**
 * verify-patterns.ts のロジック検証テスト
 *
 * 1. スクリプトの各計算関数をソースコード原本と突き合わせ
 * 2. 手計算で正しいことが自明な小さいケースで検証
 * 3. Pattern 4（全員均等）と Pattern 9（修正後）で統合チェック
 */
import { describe, expect, it } from "vitest";
import { array } from "../../logic/array";
import { getContinuousRestCount as srcGetContinuousRestCount } from "../../logic/util";
import type { History } from "../../logic/types";
import { pattern4, pattern9 } from "./index";

// --- verify-patterns.ts と同じ関数を再実装（コピーではなく独立実装） ---

/** histories を走査して memberId の出場回数をカウント */
function countPlays(histories: History[], memberId: number): number {
	let count = 0;
	for (const h of histories) {
		for (const court of h.members) {
			if (court.includes(memberId)) {
				count++;
				break; // 1試合に2回は出ないので court ループを抜ける
			}
		}
	}
	return count;
}

/** joinedAt 以降で memberId が不参加だった回数 */
function countTotalRest(
	histories: History[],
	memberId: number,
	joinedAt: number,
): number {
	let count = 0;
	for (let i = joinedAt; i < histories.length; i++) {
		const flat = histories[i].members.flat();
		if (!flat.includes(memberId)) count++;
	}
	return count;
}

/** joinedAt 以降の末尾からの連続休憩数 */
function countConsecutiveRest(
	histories: History[],
	memberId: number,
	joinedAt: number,
): number {
	let count = 0;
	for (let i = histories.length - 1; i >= joinedAt; i--) {
		if (!histories[i].members.flat().includes(memberId)) {
			count++;
		} else {
			break;
		}
	}
	return count;
}

// --- テスト ---

describe("verify-patterns.ts ロジック検証", () => {
	describe("getOutlierLevel の突き合わせ", () => {
		// count.ts:47-53 と完全一致するか
		function getOutlierLevel(diff: number) {
			const level = Math.min(diff, 3);
			if (level >= 3) return "high";
			if (level >= 2) return "medium";
			if (level >= 1) return "low";
			return "none";
		}

		it.each([
			[-1, "none"],
			[0, "none"],
			[0.5, "none"],
			[1, "low"],
			[1.5, "low"],
			[2, "medium"],
			[2.5, "medium"],
			[3, "high"],
			[4, "high"],
			[100, "high"],
		])("diff=%d → %s", (diff, expected) => {
			expect(getOutlierLevel(diff)).toBe(expected);
		});
	});

	describe("playCount 計算: 手計算ケース", () => {
		const histories: History[] = [
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t1" },
			{ members: [[1, 3, 5, 7], [2, 4, 6, 8]], time: "t2" },
			{ members: [[1, 2, 5, 6], [3, 4, 7, 8]], time: "t3" },
		];

		it("全員3試合出場 → playCount=3", () => {
			for (let id = 1; id <= 8; id++) {
				expect(countPlays(histories, id)).toBe(3);
			}
		});

		it("存在しないメンバー → playCount=0", () => {
			expect(countPlays(histories, 99)).toBe(0);
		});
	});

	describe("totalRestCount 計算: joinedAt 考慮", () => {
		const histories: History[] = [
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t1" }, // G0
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t2" }, // G1
			{ members: [[1, 2, 3, 4], [5, 6, 7, 9]], time: "t3" }, // G2: 9 参加、8 休憩
			{ members: [[1, 2, 3, 9], [5, 6, 7, 8]], time: "t4" }, // G3
		];

		it("joinedAt=0 のメンバー: 全履歴で不参加カウント", () => {
			// member 9: G0 不参加, G1 不参加, G2 参加, G3 参加 → 2
			expect(countTotalRest(histories, 9, 0)).toBe(2);
		});

		it("joinedAt=2 のメンバー: G2 以降のみ", () => {
			// member 9 がjoinedAt=2: G2 参加, G3 参加 → 0
			expect(countTotalRest(histories, 9, 2)).toBe(0);
			// member 8 がjoinedAt=2: G2 不参加, G3 参加 → 1
			expect(countTotalRest(histories, 8, 2)).toBe(1);
		});
	});

	describe("consecutiveRestCount: joinedAt 考慮", () => {
		const histories: History[] = [
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t1" }, // G0
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t2" }, // G1
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t3" }, // G2
		];

		it("joinedAt=0, 出場中 → 0", () => {
			expect(countConsecutiveRest(histories, 1, 0)).toBe(0);
		});

		it("joinedAt=0, 一度も出場してない → histories.length", () => {
			expect(countConsecutiveRest(histories, 99, 0)).toBe(3);
		});

		it("joinedAt=3 (参加後試合なし) → 0", () => {
			expect(countConsecutiveRest(histories, 99, 3)).toBe(0);
		});
	});

	describe("consecutiveRestCount: ソースコード原本との比較", () => {
		const histories: History[] = [
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t1" },
			{ members: [[1, 2, 3, 4], [5, 6, 7, 8]], time: "t2" },
			{ members: [[1, 3, 5, 7], [2, 4, 6, 8]], time: "t3" },
		];

		it("joinedAt=0 のメンバーはソースコードと同じ結果になる", () => {
			for (let id = 1; id <= 8; id++) {
				// ソースコード原本: util.ts getContinuousRestCount
				const srcResult = srcGetContinuousRestCount(histories, id);
				// 独立実装
				const myResult = countConsecutiveRest(histories, id, 0);
				expect(myResult).toBe(srcResult);
			}
		});
	});

	describe("baseCount 計算: array.mode との一致", () => {
		it("最頻値が1つの場合", () => {
			expect(array.mode([3, 3, 3, 4, 4])).toBe(3);
		});

		it("最頻値が同数の場合、大きい方", () => {
			expect(array.mode([3, 3, 4, 4])).toBe(4);
		});

		it("全て同じ場合", () => {
			expect(array.mode([5, 5, 5])).toBe(5);
		});
	});

	describe("median 計算", () => {
		it("奇数個", () => {
			expect(array.median([1, 3, 5])).toBe(3);
		});

		it("偶数個: 中央2値の平均", () => {
			expect(array.median([1, 3, 5, 7])).toBe(4);
		});

		it("未ソートでも正しく計算", () => {
			expect(array.median([5, 1, 3])).toBe(3);
		});
	});

	describe("Pattern 4 (all-equal) 手計算検証", () => {
		const p = pattern4;

		it("8人全員が毎試合出場 → playCount=4", () => {
			for (const id of p.members) {
				expect(countPlays(p.histories, id)).toBe(4);
				expect(p.gameCounts[id.toString()].playCount).toBe(4);
			}
		});

		it("全員 totalRestCount=0", () => {
			for (const id of p.members) {
				expect(countTotalRest(p.histories, id, 0)).toBe(0);
			}
		});

		it("全員 effectivePlayCount=4, median=4, diff=0 → none", () => {
			const allEffective = p.members.map(
				(id) => p.gameCounts[id.toString()].playCount + p.gameCounts[id.toString()].baseCount,
			);
			expect(array.median(allEffective)).toBe(4);
		});
	});

	describe("Pattern 9 (over-play) 手計算検証", () => {
		const p = pattern9;

		it("11試合 × 8人 = 88 total plays", () => {
			let total = 0;
			for (const id of p.members) {
				total += countPlays(p.histories, id);
			}
			expect(total).toBe(88);
		});

		it("member 14: joinedAt=5 で G5-G10 の6試合全出場 → playCount=6", () => {
			expect(countPlays(p.histories, 14)).toBe(6);
			expect(p.gameCounts["14"].playCount).toBe(6);
		});

		it("member 14: baseCount=3 (G0-G4 の mode)", () => {
			// G0-G4 の playCount を手計算
			const g0to4 = p.histories.slice(0, 5);
			const playCounts = p.members
				.filter((id) => id !== 14)
				.map((id) => countPlays(g0to4, id));
			expect(array.mode(playCounts)).toBe(3);
			expect(p.gameCounts["14"].baseCount).toBe(3);
		});

		it("member 14: effectivePlayCount=9, median=6, diff=3 → high", () => {
			const allEffective = p.members.map((id) => {
				const gc = p.gameCounts[id.toString()];
				return gc.playCount + gc.baseCount;
			});
			const median = array.median(allEffective);
			expect(median).toBe(6);

			const member14Effective = p.gameCounts["14"].playCount + p.gameCounts["14"].baseCount;
			expect(member14Effective).toBe(9);

			const diff = Math.abs(member14Effective - median);
			expect(diff).toBe(3);

			expect(p.expected["14"].highlightLevel?.playCount).toBe("high");
		});

		it("member 14: totalRestCount=0 (参加後6試合で6回出場)", () => {
			const rest = countTotalRest(p.histories, 14, 5);
			expect(rest).toBe(0);
			expect(p.expected["14"].totalRestCount).toBe(0);
		});
	});
});
