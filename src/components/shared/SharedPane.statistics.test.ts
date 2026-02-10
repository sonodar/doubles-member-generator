import { describe, expect, it } from "vitest";
import type { CurrentSettings } from "../../logic";
import { OutlierLevelProvider } from "../../logic";
import { type AlgorithmTestData, pattern12, type StatisticsTestData, standardPatterns } from "../../testing/statistics";
import { toEvents } from "../../testing/statistics/toEvents";
import { replayEvents } from "./replayEvents";

function runStatisticsTest(pattern: StatisticsTestData) {
	const events = toEvents(pattern);
	const { settings } = replayEvents(events);
	const { histories, members, gameCounts } = settings;
	const { getValue, getLevel } = OutlierLevelProvider({ histories, members, gameCounts });
	const { expected } = pattern;

	for (const [memberId, exp] of Object.entries(expected)) {
		const id = Number(memberId);

		// playCount の表示値（生値）
		it(`member ${memberId}: playCount 表示値 = ${exp.playCount}`, () => {
			expect(getValue("playCount", id)).toBe(exp.playCount);
		});

		// totalRestCount
		if (exp.totalRestCount !== undefined) {
			it(`member ${memberId}: totalRestCount = ${exp.totalRestCount}`, () => {
				expect(getValue("totalRestCount", id)).toBe(exp.totalRestCount);
			});
		}

		// consecutiveRestCount
		if (exp.consecutiveRestCount !== undefined) {
			it(`member ${memberId}: consecutiveRestCount = ${exp.consecutiveRestCount}`, () => {
				expect(getValue("restCount", id)).toBe(exp.consecutiveRestCount);
			});
		}

		// highlightLevel
		if (exp.highlightLevel) {
			if (exp.highlightLevel.playCount !== undefined) {
				it(`member ${memberId}: playCount highlight = ${exp.highlightLevel.playCount}`, () => {
					expect(getLevel("playCount", id)).toBe(exp.highlightLevel!.playCount);
				});
			}
			if (exp.highlightLevel.totalRestCount !== undefined) {
				it(`member ${memberId}: totalRestCount highlight = ${exp.highlightLevel.totalRestCount}`, () => {
					expect(getLevel("totalRestCount", id)).toBe(exp.highlightLevel!.totalRestCount);
				});
			}
			if (exp.highlightLevel.restCount !== undefined) {
				it(`member ${memberId}: restCount highlight = ${exp.highlightLevel.restCount}`, () => {
					expect(getLevel("restCount", id)).toBe(exp.highlightLevel!.restCount);
				});
			}
		}
	}
}

describe("SharedPane 統計ロジック検証（イベントリプレイ経路）", () => {
	standardPatterns.forEach((pattern, index) => {
		describe(`pattern${index + 1}: ${pattern.description}`, () => {
			runStatisticsTest(pattern);
		});
	});

	// pattern12: アルゴリズム別テスト
	describe("pattern12: アルゴリズム別テスト", () => {
		const p12 = pattern12 as AlgorithmTestData;
		for (const [algName, algData] of Object.entries(p12.algorithms)) {
			describe(`algorithm: ${algName}`, () => {
				const testData: StatisticsTestData = {
					description: p12.description,
					courtCount: p12.courtCount,
					members: p12.members,
					histories: p12.histories,
					joiners: p12.joiners,
					algorithm: algName as CurrentSettings["algorithm"],
					expected: algData.expected,
				};
				runStatisticsTest(testData);
			});
		}
	});
});
