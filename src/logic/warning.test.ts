import { describe, expect, it } from "vitest";
import type { CurrentSettings } from "./types";
import { Algorithms } from "./types";
import { calculateWarningThresholds, detectWarnings } from "./warning";

describe("calculateWarningThresholds", () => {
	describe("基本閾値計算", () => {
		it("2コート10人の場合、休憩人数2人で閾値2を返す", () => {
			const result = calculateWarningThresholds({
				courtCount: 2,
				memberCount: 10,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(2);
			expect(result.playCountDiffThreshold).toBe(2);
		});

		it("4コート24人の場合、休憩人数8人で閾値3を返す", () => {
			const result = calculateWarningThresholds({
				courtCount: 4,
				memberCount: 24,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(3);
			expect(result.playCountDiffThreshold).toBe(3);
		});

		it("1コート5人の場合、休憩人数1人で閾値2を返す", () => {
			const result = calculateWarningThresholds({
				courtCount: 1,
				memberCount: 5,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(2);
			expect(result.playCountDiffThreshold).toBe(2);
		});

		it("3コート16人の場合、休憩人数4人で閾値2を返す", () => {
			const result = calculateWarningThresholds({
				courtCount: 3,
				memberCount: 16,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(2);
			expect(result.playCountDiffThreshold).toBe(2);
		});

		it("4コート20人の場合、休憩人数4人で閾値2を返す", () => {
			const result = calculateWarningThresholds({
				courtCount: 4,
				memberCount: 20,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(2);
			expect(result.playCountDiffThreshold).toBe(2);
		});
	});

	describe("アルゴリズム補正", () => {
		it("ばらつき重視の場合、閾値に+1される", () => {
			const result = calculateWarningThresholds({
				courtCount: 2,
				memberCount: 10,
				algorithm: Algorithms.DISCRETENESS,
			});
			expect(result.consecutiveRestThreshold).toBe(3);
			expect(result.playCountDiffThreshold).toBe(3);
		});

		it("均等性重視の場合、閾値はそのまま", () => {
			const result = calculateWarningThresholds({
				courtCount: 2,
				memberCount: 10,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(2);
			expect(result.playCountDiffThreshold).toBe(2);
		});
	});

	describe("エッジケース", () => {
		it("休憩人数が0の場合、閾値はInfinity", () => {
			const result = calculateWarningThresholds({
				courtCount: 2,
				memberCount: 8,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(Number.POSITIVE_INFINITY);
			expect(result.playCountDiffThreshold).toBe(Number.POSITIVE_INFINITY);
		});

		it("休憩人数が負の場合、閾値はInfinity", () => {
			const result = calculateWarningThresholds({
				courtCount: 3,
				memberCount: 8,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBe(Number.POSITIVE_INFINITY);
			expect(result.playCountDiffThreshold).toBe(Number.POSITIVE_INFINITY);
		});

		it("閾値の最小値は1を保証する", () => {
			// 極端に休憩確率が高いケース（ほぼ全員休憩）でも閾値は1以上
			const result = calculateWarningThresholds({
				courtCount: 1,
				memberCount: 100,
				algorithm: Algorithms.EVENNESS,
			});
			expect(result.consecutiveRestThreshold).toBeGreaterThanOrEqual(1);
			expect(result.playCountDiffThreshold).toBeGreaterThanOrEqual(1);
		});
	});
});

describe("detectWarnings", () => {
	const createSettings = (overrides: Partial<CurrentSettings> = {}): CurrentSettings => ({
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.EVENNESS,
		...overrides,
	});

	describe("連続休憩警告", () => {
		it("連続休憩回数が閾値以上のメンバーを警告対象とする", () => {
			// メンバー1が2回連続で休憩している履歴
			const settings = createSettings({
				histories: [
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:00:00",
					},
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:30:00",
					},
				],
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			const member1Warning = result.warnings.find((w) => w.memberId === 1 && w.type === "consecutiveRest");
			expect(member1Warning).toBeDefined();
			expect(member1Warning?.value).toBe(2);
			expect(member1Warning?.threshold).toBe(2);
		});

		it("連続休憩回数が閾値未満のメンバーは警告対象外", () => {
			const settings = createSettings({
				histories: [
					{
						members: [
							[1, 2, 3, 4],
							[5, 6, 7, 8],
						],
						time: "2024-01-01T10:00:00",
					},
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:30:00",
					},
				],
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			// メンバー1は1回のみ休憩なので警告なし
			const member1Warning = result.warnings.find((w) => w.memberId === 1 && w.type === "consecutiveRest");
			expect(member1Warning).toBeUndefined();
		});

		it("連続休憩回数がちょうど閾値のメンバーは警告対象", () => {
			const settings = createSettings({
				histories: [
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:00:00",
					},
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:30:00",
					},
				],
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			// メンバー1と10は2回連続休憩で、閾値2以上なので警告
			const member1Warning = result.warnings.find((w) => w.memberId === 1 && w.type === "consecutiveRest");
			const member10Warning = result.warnings.find((w) => w.memberId === 10 && w.type === "consecutiveRest");
			expect(member1Warning).toBeDefined();
			expect(member10Warning).toBeDefined();
		});
	});

	describe("試合回数差警告", () => {
		it("試合回数差が閾値以上の場合、最少メンバーを警告対象とする", () => {
			const settings = createSettings({
				gameCounts: {
					1: { playCount: 0, baseCount: 0 },
					2: { playCount: 2, baseCount: 0 },
					3: { playCount: 2, baseCount: 0 },
					4: { playCount: 2, baseCount: 0 },
					5: { playCount: 2, baseCount: 0 },
					6: { playCount: 2, baseCount: 0 },
					7: { playCount: 2, baseCount: 0 },
					8: { playCount: 2, baseCount: 0 },
					9: { playCount: 2, baseCount: 0 },
					10: { playCount: 2, baseCount: 0 },
				},
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			const warning = result.warnings.find((w) => w.memberId === 1 && w.type === "playCountDiff");
			expect(warning).toBeDefined();
			expect(warning?.value).toBe(0);
			expect(warning?.threshold).toBe(2);
		});

		it("試合回数差が閾値未満の場合、警告なし", () => {
			const settings = createSettings({
				gameCounts: {
					1: { playCount: 1, baseCount: 0 },
					2: { playCount: 2, baseCount: 0 },
					3: { playCount: 2, baseCount: 0 },
					4: { playCount: 2, baseCount: 0 },
					5: { playCount: 2, baseCount: 0 },
					6: { playCount: 2, baseCount: 0 },
					7: { playCount: 2, baseCount: 0 },
					8: { playCount: 2, baseCount: 0 },
					9: { playCount: 2, baseCount: 0 },
					10: { playCount: 2, baseCount: 0 },
				},
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			const warning = result.warnings.find((w) => w.type === "playCountDiff");
			expect(warning).toBeUndefined();
		});

		it("途中参加メンバーの補正値を加算して比較する", () => {
			const settings = createSettings({
				gameCounts: {
					1: { playCount: 0, baseCount: 2 }, // 途中参加で補正値2、実質2
					2: { playCount: 2, baseCount: 0 }, // 通常参加で2
					3: { playCount: 2, baseCount: 0 },
					4: { playCount: 2, baseCount: 0 },
					5: { playCount: 2, baseCount: 0 },
					6: { playCount: 2, baseCount: 0 },
					7: { playCount: 2, baseCount: 0 },
					8: { playCount: 2, baseCount: 0 },
					9: { playCount: 2, baseCount: 0 },
					10: { playCount: 2, baseCount: 0 },
				},
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			// 補正後は全員2回なので差は0、警告なし
			const warning = result.warnings.find((w) => w.type === "playCountDiff");
			expect(warning).toBeUndefined();
		});
	});

	describe("警告状態オブジェクト", () => {
		it("警告がある場合、hasWarningsはtrue", () => {
			const settings = createSettings({
				histories: [
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:00:00",
					},
					{
						members: [
							[2, 3, 4, 5],
							[6, 7, 8, 9],
						],
						time: "2024-01-01T10:30:00",
					},
				],
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			expect(result.hasWarnings).toBe(true);
		});

		it("警告がない場合、hasWarningsはfalse", () => {
			const settings = createSettings({
				histories: [
					{
						members: [
							[1, 2, 3, 4],
							[5, 6, 7, 8],
						],
						time: "2024-01-01T10:00:00",
					},
				],
			});
			const thresholds = { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 };

			const result = detectWarnings(settings, thresholds);

			expect(result.hasWarnings).toBe(false);
		});

		it("閾値情報が正しく含まれる", () => {
			const settings = createSettings();
			const thresholds = { consecutiveRestThreshold: 3, playCountDiffThreshold: 4 };

			const result = detectWarnings(settings, thresholds);

			expect(result.thresholds).toEqual(thresholds);
		});
	});
});
