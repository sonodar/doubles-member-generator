import { describe, expect, it } from "vitest";
import type { Event } from "../../api/types";
import { EventType } from "../../api/types";
import type { CurrentSettings } from "../../logic/types";
import { replayEvents } from "./replayEvents";

describe("replayEvents", () => {
	const initialSettings: CurrentSettings = {
		courtCount: 1,
		members: [1, 2, 3, 4, 5],
		histories: [],
		gameCounts: {
			1: { playCount: 0, baseCount: 0 },
			2: { playCount: 0, baseCount: 0 },
			3: { playCount: 0, baseCount: 0 },
			4: { playCount: 0, baseCount: 0 },
			5: { playCount: 0, baseCount: 0 },
		},
		algorithm: "evenness",
	};

	it("Initialize イベント1件のみで CurrentSettings が返ること", () => {
		const events: Event[] = [
			{
				id: "1",
				type: EventType.Initialize,
				payload: initialSettings,
				occurredAt: new Date(),
			},
		];

		const result = replayEvents(events);
		expect(result.settings).toEqual(initialSettings);
		expect(result.finished).toBe(false);
	});

	it("Generate イベントを含む場合、状態が更新されること", () => {
		const events: Event[] = [
			{
				id: "1",
				type: EventType.Initialize,
				payload: initialSettings,
				occurredAt: new Date(),
			},
			{
				id: "2",
				type: EventType.Generate,
				payload: { members: [[1, 2, 3, 4]] },
				occurredAt: new Date(),
			},
		];

		const result = replayEvents(events);
		expect(result.settings.histories).toHaveLength(1);
		expect(result.finished).toBe(false);
	});

	it("Finish イベントを含む場合、finished が true になること", () => {
		const events: Event[] = [
			{
				id: "1",
				type: EventType.Initialize,
				payload: initialSettings,
				occurredAt: new Date(),
			},
			{
				id: "2",
				type: EventType.Finish,
				occurredAt: new Date(),
			},
		];

		const result = replayEvents(events);
		expect(result.finished).toBe(true);
	});

	it("先頭が Initialize でない場合にエラーを投げること", () => {
		const events: Event[] = [
			{
				id: "1",
				type: EventType.Generate,
				payload: { members: [[1, 2, 3, 4]] },
				occurredAt: new Date(),
			},
		];

		expect(() => replayEvents(events)).toThrow("Invalid first event type");
	});
});
