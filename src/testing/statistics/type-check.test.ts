/**
 * 型定義の検証用テストファイル
 * このファイルはTypeScriptの型チェックが通ることを確認するためのものです
 */
import { describe, expect, it } from "vitest";
import {
	type AlgorithmTestData,
	type ExpectedHighlightLevel,
	type ExpectedMemberStats,
	pattern1,
	pattern8,
	pattern10,
	pattern12,
	type StatisticsTestData,
	standardPatterns,
} from "./index";

describe("テストデータ型定義", () => {
	describe("StatisticsTestData型", () => {
		it.each(standardPatterns.map((p, i) => [i + 1, p]))("pattern%i が正しい型を持つこと", (_, pattern) => {
			const p = pattern as StatisticsTestData;

			// 必須フィールドの検証
			expect(typeof p.description).toBe("string");
			expect(typeof p.courtCount).toBe("number");
			expect(Array.isArray(p.members)).toBe(true);
			expect(Array.isArray(p.histories)).toBe(true);
			expect(["evenness", "discreteness"]).toContain(p.algorithm);
			expect(typeof p.expected).toBe("object");
		});

		it("pattern8 が leftMembers と showLeftMember を持つこと", () => {
			expect(pattern8.leftMembers).toBeDefined();
			expect(pattern8.showLeftMember).toBe(true);
		});

		it("pattern10 が warning を持つこと", () => {
			const expected14 = pattern10.expected["14"];
			expect(expected14.warning).toBeDefined();
			expect(expected14.warning?.consecutiveRestWarning).toBe(true);
		});
	});

	describe("AlgorithmTestData型", () => {
		it("pattern12 が algorithms プロパティを持つこと", () => {
			const p12: AlgorithmTestData = pattern12;

			expect(p12.algorithms).toBeDefined();
			expect(p12.algorithms.evenness).toBeDefined();
			expect(p12.algorithms.discreteness).toBeDefined();
			expect(p12.algorithms.evenness.expected).toBeDefined();
			expect(p12.algorithms.discreteness.expected).toBeDefined();
		});

		it("pattern12 が algorithm プロパティを持たないこと", () => {
			// @ts-expect-error - AlgorithmTestData は algorithm を持たない
			const _: string = pattern12.algorithm;
			expect(pattern12).not.toHaveProperty("algorithm");
		});
	});

	describe("ExpectedMemberStats型", () => {
		it("期待値が正しいプロパティを持つこと", () => {
			const expected14: ExpectedMemberStats = pattern1.expected["14"];

			expect(typeof expected14.playCount).toBe("number");
			expect(expected14.effectivePlayCount).toBeDefined();
			expect(expected14.totalRestCount).toBeDefined();
			expect(expected14.consecutiveRestCount).toBeDefined();
			expect(expected14.highlightLevel).toBeDefined();
		});
	});

	describe("ExpectedHighlightLevel型", () => {
		it("highlightLevel が正しい OutlierLevel 値を持つこと", () => {
			const hl: ExpectedHighlightLevel | undefined = pattern1.expected["14"].highlightLevel;
			const validLevels = ["none", "low", "medium", "high"];

			if (hl?.playCount) {
				expect(validLevels).toContain(hl.playCount);
			}
			if (hl?.totalRestCount) {
				expect(validLevels).toContain(hl.totalRestCount);
			}
			if (hl?.restCount) {
				expect(validLevels).toContain(hl.restCount);
			}
		});
	});
});
