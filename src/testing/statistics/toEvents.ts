import type { Event } from "../../api/types";
import { EventType } from "../../api/types";
import type { StatisticsTestData } from "./index";

export function toEvents(pattern: StatisticsTestData): Event[] {
	const joinerIds = new Set(Object.values(pattern.joiners ?? {}).map((j) => j.id));

	// 初期メンバー = all members + leftMembers - joiners
	const allMembers = [...pattern.members, ...(pattern.leftMembers ?? [])];
	const initialMembers = allMembers.filter((id) => !joinerIds.has(id));

	const events: Event[] = [];
	let eventIndex = 0;

	// Initialize イベント
	events.push({
		id: String(eventIndex++),
		type: EventType.Initialize,
		payload: {
			courtCount: pattern.courtCount,
			members: [...initialMembers],
			histories: [],
			gameCounts: Object.fromEntries(initialMembers.map((id) => [id, { playCount: 0, baseCount: 0 }])),
			algorithm: pattern.algorithm,
		},
		occurredAt: new Date(0),
	});

	// 各 history について、joiner があれば Join → Generate の順でイベントを生成
	for (let i = 0; i < pattern.histories.length; i++) {
		const joiner = pattern.joiners?.[String(i)];
		if (joiner) {
			events.push({
				id: String(eventIndex++),
				type: EventType.Join,
				occurredAt: new Date(i),
			} as Event);
		}

		events.push({
			id: String(eventIndex++),
			type: EventType.Generate,
			payload: { members: pattern.histories[i].members },
			occurredAt: new Date(i),
		} as Event);
	}

	// histories の後に来る joiner（histories.length 以降の index）
	const joiners = pattern.joiners ?? {};
	for (const [indexStr] of Object.entries(joiners)) {
		const index = Number(indexStr);
		if (index >= pattern.histories.length) {
			events.push({
				id: String(eventIndex++),
				type: EventType.Join,
				occurredAt: new Date(index),
			} as Event);
		}
	}

	// leftMembers の Leave イベント
	if (pattern.leftMembers) {
		for (const memberId of pattern.leftMembers) {
			events.push({
				id: String(eventIndex++),
				type: EventType.Leave,
				payload: { memberId },
				occurredAt: new Date(pattern.histories.length),
			} as Event);
		}
	}

	return events;
}
