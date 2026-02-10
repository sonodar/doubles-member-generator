import { describe, expect, it } from "vitest";
import { EventType } from "../../api/types";
import type { StatisticsTestData } from "./index";
import { toEvents } from "./toEvents";

describe("toEvents", () => {
	it("joiner なし・history 1件の場合、Initialize + Generate の2イベントが返ること", () => {
		const pattern: StatisticsTestData = {
			description: "test",
			courtCount: 1,
			members: [1, 2, 3, 4, 5],
			histories: [{ members: [[1, 2, 3, 4]], time: "2026/1/1 00:00:00" }],
			algorithm: "evenness",
			expected: {},
		};

		const events = toEvents(pattern);

		expect(events).toHaveLength(2);
		expect(events[0].type).toBe(EventType.Initialize);
		expect(events[1].type).toBe(EventType.Generate);

		// Initialize の payload に初期メンバー全員が含まれること
		expect(events[0].type).toBe(EventType.Initialize);
		if (events[0].type === EventType.Initialize) {
			expect(events[0].payload.members).toEqual([1, 2, 3, 4, 5]);
			expect(events[0].payload.courtCount).toBe(1);
			expect(events[0].payload.algorithm).toBe("evenness");
		}

		// Generate の payload に history の members が含まれること
		if (events[1].type === EventType.Generate) {
			expect(events[1].payload.members).toEqual([[1, 2, 3, 4]]);
		}
	});

	it("途中参加者を含むパターンで Initialize → Generate... → Join → Generate の順でイベントが生成されること", () => {
		const pattern: StatisticsTestData = {
			description: "test with joiner",
			courtCount: 1,
			members: [1, 2, 3, 4, 5, 6],
			histories: [
				{ members: [[1, 2, 3, 4]], time: "2026/1/1 00:00:00" },
				{ members: [[1, 2, 3, 5]], time: "2026/1/1 00:01:00" },
				{ members: [[1, 2, 4, 6]], time: "2026/1/1 00:02:00" },
			],
			joiners: { "2": { id: 6 } },
			algorithm: "evenness",
			expected: {},
		};

		const events = toEvents(pattern);

		// Initialize + Generate(0) + Generate(1) + Join + Generate(2) = 5
		expect(events).toHaveLength(5);
		expect(events[0].type).toBe(EventType.Initialize);
		expect(events[1].type).toBe(EventType.Generate);
		expect(events[2].type).toBe(EventType.Generate);
		expect(events[3].type).toBe(EventType.Join);
		expect(events[4].type).toBe(EventType.Generate);

		// Initialize の payload には joiner(6) を除く初期メンバーが含まれること
		if (events[0].type === EventType.Initialize) {
			expect(events[0].payload.members).toEqual([1, 2, 3, 4, 5]);
		}
	});

	it("leftMembers を含むパターンで、初期メンバーに leftMembers が含まれること", () => {
		const pattern: StatisticsTestData = {
			description: "test with left member",
			courtCount: 1,
			members: [1, 2, 3, 4],
			histories: [
				{ members: [[1, 2, 3, 4]], time: "2026/1/1 00:00:00" },
				{ members: [[1, 2, 3, 5]], time: "2026/1/1 00:01:00" },
			],
			joiners: { "1": { id: 5 } },
			leftMembers: [5],
			algorithm: "evenness",
			expected: {},
		};

		const events = toEvents(pattern);

		// Initialize + Generate(0) + Join + Generate(1) + Leave(5) = 5
		expect(events).toHaveLength(5);
		expect(events[0].type).toBe(EventType.Initialize);

		// Initialize に leftMembers は含まれないが joiner(5) も含まれない初期メンバー
		if (events[0].type === EventType.Initialize) {
			expect(events[0].payload.members).toEqual([1, 2, 3, 4]);
		}

		// 最後に Leave イベントがあること
		expect(events[4].type).toBe(EventType.Leave);
		if (events[4].type === EventType.Leave) {
			expect(events[4].payload.memberId).toBe(5);
		}
	});
});
