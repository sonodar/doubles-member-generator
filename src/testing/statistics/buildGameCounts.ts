import { array } from "../../logic/array";
import { addHistory } from "../../logic/generate";
import type { CurrentSettings, PlayCountPerMember } from "../../logic/types";
import type { StatisticsTestData } from "./index";

export function buildGameCounts(
	data: Pick<StatisticsTestData, "members" | "histories" | "joiners" | "algorithm" | "courtCount"> & {
		leftMembers?: number[];
	},
): PlayCountPerMember {
	// 1. Get joiner IDs set
	const joinerIds = new Set(Object.values(data.joiners ?? {}).map((j) => j.id));

	// 2. Initial members = all members + leftMembers - joiners
	const allMembers = [...data.members, ...(data.leftMembers ?? [])];
	const initialMembers = allMembers.filter((id) => !joinerIds.has(id));

	// 3. Initialize settings
	let settings: CurrentSettings = {
		courtCount: data.courtCount,
		members: [...initialMembers],
		histories: [],
		gameCounts: Object.fromEntries(initialMembers.map((id) => [id, { playCount: 0, baseCount: 0 }])),
		algorithm: data.algorithm ?? "evenness",
	};

	// 4. Replay each history
	for (let i = 0; i < data.histories.length; i++) {
		// Check for joiner at this index
		const joiner = data.joiners?.[String(i)];
		if (joiner) {
			const baseCount = array.mode(Object.values(settings.gameCounts).map((gc) => gc.playCount));
			settings.members.push(joiner.id);
			settings.gameCounts[joiner.id] = { playCount: 0, baseCount, joinedAt: i };
		}

		// Apply addHistory (which internally calls increment - the buggy function)
		settings = addHistory(settings, data.histories[i].members);
	}

	// 5. Handle joiners after all histories
	const joiners = data.joiners ?? {};
	for (const [indexStr, joiner] of Object.entries(joiners)) {
		const index = Number(indexStr);
		if (index >= data.histories.length) {
			const baseCount = array.mode(Object.values(settings.gameCounts).map((gc) => gc.playCount));
			settings.members.push(joiner.id);
			settings.gameCounts[joiner.id] = { playCount: 0, baseCount, joinedAt: index };
		}
	}

	return settings.gameCounts;
}
