/**
 * テストデータ検証スクリプト
 *
 * 各パターンの histories から gameCounts と expected を再計算し、
 * JSON ファイルの記載値との不整合を検出する。
 *
 * 実行: npx tsx src/testing/statistics/verify-patterns.ts
 */
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { array } from "../../logic/array";
import type { OutlierLevel } from "../../logic/count";
import type { History, PlayCount } from "../../logic/types";

// --- 型定義 ---

type GameCounts = Record<string, PlayCount>;
type HighlightLevel = {
	playCount?: OutlierLevel;
	totalRestCount?: OutlierLevel;
	restCount?: OutlierLevel;
};
type ExpectedMemberStats = {
	playCount: number;
	effectivePlayCount?: number;
	totalRestCount?: number;
	consecutiveRestCount?: number;
	highlightLevel?: HighlightLevel;
};
type PatternData = {
	description: string;
	courtCount: number;
	members: number[];
	histories: History[];
	gameCounts: GameCounts;
	algorithm?: string;
	expected?: Record<string, ExpectedMemberStats>;
	algorithms?: {
		evenness: { expected: Record<string, ExpectedMemberStats> };
		discreteness: { expected: Record<string, ExpectedMemberStats> };
	};
	leftMembers?: number[];
};

// --- count.ts と同じハイライト判定ロジック ---

function getOutlierLevel(diff: number): OutlierLevel {
	const level = Math.min(diff, 3);
	if (level >= 3) return "high";
	if (level >= 2) return "medium";
	if (level >= 1) return "low";
	return "none";
}

// --- 計算関数 ---

function calcPlayCountFromHistories(histories: History[], memberId: number): number {
	return histories.filter((h) => h.members.flat().includes(memberId)).length;
}

function calcTotalRestCount(histories: History[], memberId: number, joinedAt: number): number {
	const relevant = histories.slice(joinedAt);
	return relevant.filter((h) => !h.members.flat().includes(memberId)).length;
}

function calcConsecutiveRestCount(histories: History[], memberId: number, joinedAt: number): number {
	const relevant = histories.slice(joinedAt);
	if (relevant.length === 0) return 0;
	let count = 0;
	for (let i = relevant.length - 1; i >= 0; i--) {
		if (!relevant[i].members.flat().includes(memberId)) {
			count++;
		} else {
			break;
		}
	}
	return count;
}

function calcBaseCount(histories: History[], members: number[], gameCounts: GameCounts, joinedAt: number): number {
	// joinedAt 時点の既存メンバーの playCount を計算
	const historiesAtJoin = histories.slice(0, joinedAt);
	const existingMembers = members.filter(
		(id) => !gameCounts[id.toString()] || (gameCounts[id.toString()].joinedAt ?? 0) < joinedAt,
	);

	if (existingMembers.length === 0) return 0;

	const playCounts = existingMembers.map((id) => calcPlayCountFromHistories(historiesAtJoin, id));

	return array.mode(playCounts);
}

// --- メイン検証ロジック ---

type Issue = {
	field: string;
	memberId: string;
	expected: unknown;
	actual: unknown;
};

function verifyPattern(_name: string, data: PatternData, expectedData: Record<string, ExpectedMemberStats>): Issue[] {
	const issues: Issue[] = [];
	const allMembers = [...data.members, ...(data.leftMembers ?? [])];

	// 1. gameCounts.playCount の検証
	const correctPlayCounts: Record<string, number> = {};
	for (const id of allMembers) {
		const correct = calcPlayCountFromHistories(data.histories, id);
		correctPlayCounts[id.toString()] = correct;
		const recorded = data.gameCounts[id.toString()]?.playCount;
		if (recorded !== undefined && recorded !== correct) {
			issues.push({
				field: "gameCounts.playCount",
				memberId: id.toString(),
				expected: correct,
				actual: recorded,
			});
		}
	}

	// 2. baseCount の検証（途中参加メンバーのみ）
	const correctBaseCounts: Record<string, number> = {};
	for (const id of allMembers) {
		const gc = data.gameCounts[id.toString()];
		if (!gc) continue;
		const joinedAt = gc.joinedAt ?? 0;
		if (joinedAt === 0) {
			correctBaseCounts[id.toString()] = 0;
			continue;
		}
		const correctBase = calcBaseCount(data.histories, allMembers, data.gameCounts, joinedAt);
		correctBaseCounts[id.toString()] = correctBase;
		if (gc.baseCount !== correctBase) {
			issues.push({
				field: "gameCounts.baseCount",
				memberId: id.toString(),
				expected: correctBase,
				actual: gc.baseCount,
			});
		}
	}

	// 3. expected の検証
	for (const [memberId, exp] of Object.entries(expectedData)) {
		const gc = data.gameCounts[memberId];
		if (!gc) continue;
		const joinedAt = gc.joinedAt ?? 0;
		const correctPlay = correctPlayCounts[memberId] ?? 0;
		const correctBase = correctBaseCounts[memberId] ?? gc.baseCount;
		const correctEffective = correctPlay + correctBase;

		// playCount
		if (exp.playCount !== correctPlay) {
			issues.push({
				field: "expected.playCount",
				memberId,
				expected: correctPlay,
				actual: exp.playCount,
			});
		}

		// effectivePlayCount
		if (exp.effectivePlayCount !== undefined && exp.effectivePlayCount !== correctEffective) {
			issues.push({
				field: "expected.effectivePlayCount",
				memberId,
				expected: correctEffective,
				actual: exp.effectivePlayCount,
			});
		}

		// totalRestCount
		const correctTotalRest = calcTotalRestCount(data.histories, Number(memberId), joinedAt);
		if (exp.totalRestCount !== undefined && exp.totalRestCount !== correctTotalRest) {
			issues.push({
				field: "expected.totalRestCount",
				memberId,
				expected: correctTotalRest,
				actual: exp.totalRestCount,
			});
		}

		// consecutiveRestCount
		const correctConsRest = calcConsecutiveRestCount(data.histories, Number(memberId), joinedAt);
		if (exp.consecutiveRestCount !== undefined && exp.consecutiveRestCount !== correctConsRest) {
			issues.push({
				field: "expected.consecutiveRestCount",
				memberId,
				expected: correctConsRest,
				actual: exp.consecutiveRestCount,
			});
		}

		// highlightLevel
		if (exp.highlightLevel) {
			// effectivePlayCount のハイライト
			const allEffective = allMembers.map((id) => {
				const pc = correctPlayCounts[id.toString()] ?? 0;
				const bc = correctBaseCounts[id.toString()] ?? data.gameCounts[id.toString()]?.baseCount ?? 0;
				return pc + bc;
			});
			const effectiveMedian = array.median(allEffective);

			if (exp.highlightLevel.playCount !== undefined) {
				const diff = Math.abs(correctEffective - effectiveMedian);
				const correctLevel = getOutlierLevel(diff);
				if (exp.highlightLevel.playCount !== correctLevel) {
					issues.push({
						field: "expected.highlightLevel.playCount",
						memberId,
						expected: `${correctLevel} (effectivePlayCount=${correctEffective}, median=${effectiveMedian}, diff=${diff})`,
						actual: exp.highlightLevel.playCount,
					});
				}
			}

			// totalRestCount のハイライト
			if (exp.highlightLevel.totalRestCount !== undefined) {
				const allTotalRest = allMembers.map((id) => {
					const ja = data.gameCounts[id.toString()]?.joinedAt ?? 0;
					return calcTotalRestCount(data.histories, id, ja);
				});
				const totalRestMedian = array.median(allTotalRest);
				const diff = correctTotalRest - totalRestMedian;
				const correctLevel = getOutlierLevel(diff);
				if (exp.highlightLevel.totalRestCount !== correctLevel) {
					issues.push({
						field: "expected.highlightLevel.totalRestCount",
						memberId,
						expected: `${correctLevel} (totalRestCount=${correctTotalRest}, median=${totalRestMedian}, diff=${diff})`,
						actual: exp.highlightLevel.totalRestCount,
					});
				}
			}

			// restCount（連続休憩）のハイライト
			if (exp.highlightLevel.restCount !== undefined) {
				const correctLevel = getOutlierLevel(correctConsRest);
				if (exp.highlightLevel.restCount !== correctLevel) {
					issues.push({
						field: "expected.highlightLevel.restCount",
						memberId,
						expected: `${correctLevel} (consecutiveRestCount=${correctConsRest})`,
						actual: exp.highlightLevel.restCount,
					});
				}
			}
		}
	}

	return issues;
}

// --- 実行 ---

const dir = resolve(import.meta.dirname ?? __dirname);
const patternFiles = [
	"pattern1-fair-play.json",
	"pattern2-unfair-rest.json",
	"pattern3-initial-member-rest.json",
	"pattern4-all-equal.json",
	"pattern5-multiple-joiners.json",
	"pattern6-consecutive-rest.json",
	"pattern7-just-joined.json",
	"pattern8-left-member.json",
	"pattern9-over-play.json",
	"pattern10-warning.json",
	"pattern11-zero-base.json",
	"pattern12-algorithm.json",
];

let totalIssues = 0;

for (const file of patternFiles) {
	const filePath = resolve(dir, file);
	const data: PatternData = JSON.parse(readFileSync(filePath, "utf-8"));
	const name = basename(file, ".json");

	if (data.algorithms) {
		// Pattern 12: アルゴリズム別
		for (const [alg, algData] of Object.entries(data.algorithms)) {
			const issues = verifyPattern(`${name} (${alg})`, data, algData.expected);
			if (issues.length > 0) {
				console.log(`\n❌ ${name} (${alg}): ${issues.length} 件の不整合`);
				for (const issue of issues) {
					console.log(
						`  - [${issue.field}] member ${issue.memberId}: 記載=${JSON.stringify(issue.actual)} → 正しくは=${JSON.stringify(issue.expected)}`,
					);
				}
				totalIssues += issues.length;
			} else {
				console.log(`✅ ${name} (${alg}): OK`);
			}
		}
	} else if (data.expected) {
		const issues = verifyPattern(name, data, data.expected);
		if (issues.length > 0) {
			console.log(`\n❌ ${name}: ${issues.length} 件の不整合`);
			for (const issue of issues) {
				console.log(
					`  - [${issue.field}] member ${issue.memberId}: 記載=${JSON.stringify(issue.actual)} → 正しくは=${JSON.stringify(issue.expected)}`,
				);
			}
			totalIssues += issues.length;
		} else {
			console.log(`✅ ${name}: OK`);
		}
	}
}

console.log(`\n--- 合計: ${totalIssues} 件の不整合 ---`);
process.exit(totalIssues > 0 ? 1 : 0);
