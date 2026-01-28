import { describe, expect, test } from "vitest";
import { CONSECUTIVE_THRESHOLD_MS, isConsecutiveOperation } from "./consecutiveOperation";
import type { History } from "./types";

describe("consecutiveOperation", () => {
	describe("isConsecutiveOperation", () => {
		test("閾値は60秒（1分）であること", () => {
			expect(CONSECUTIVE_THRESHOLD_MS).toBe(60 * 1000);
		});

		test("履歴あり・1分以内で true を返す", () => {
			const now = new Date("2026-01-28T12:00:30+09:00");
			const histories: History[] = [
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: "2026-01-28T12:00:00+09:00",
				},
			];

			const result = isConsecutiveOperation(histories, now);

			expect(result).toBe(true);
		});

		test("履歴あり・ちょうど1分で false を返す（1分以上経過）", () => {
			const now = new Date("2026-01-28T12:01:00+09:00");
			const histories: History[] = [
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: "2026-01-28T12:00:00+09:00",
				},
			];

			const result = isConsecutiveOperation(histories, now);

			expect(result).toBe(false);
		});

		test("履歴あり・1分以上で false を返す", () => {
			const now = new Date("2026-01-28T12:05:00+09:00");
			const histories: History[] = [
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: "2026-01-28T12:00:00+09:00",
				},
			];

			const result = isConsecutiveOperation(histories, now);

			expect(result).toBe(false);
		});

		test("履歴なしで false を返す", () => {
			const result = isConsecutiveOperation([]);

			expect(result).toBe(false);
		});

		test("不正な時刻フォーマットで false を返す（安全側）", () => {
			const histories: History[] = [
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: "invalid-date-format",
				},
			];

			const result = isConsecutiveOperation(histories);

			expect(result).toBe(false);
		});

		test("複数履歴がある場合、最新（配列末尾）の履歴を参照する", () => {
			const now = new Date("2026-01-28T12:00:30+09:00");
			const histories: History[] = [
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: "2026-01-28T11:00:00+09:00", // 古い履歴
				},
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: "2026-01-28T12:00:00+09:00", // 最新履歴（30秒前）
				},
			];

			const result = isConsecutiveOperation(histories, now);

			expect(result).toBe(true);
		});

		test("now パラメータを省略した場合、現在時刻が使用される", () => {
			// 古い履歴を作成（1分以上前）
			const oldTime = new Date(Date.now() - 2 * 60 * 1000).toISOString();
			const histories: History[] = [
				{
					members: [
						[1, 2, 3, 4],
						[5, 6, 7, 8],
					],
					time: oldTime,
				},
			];

			const result = isConsecutiveOperation(histories);

			expect(result).toBe(false);
		});
	});
});
