import { type CurrentSettings, type GameMembers, type History, type PlayCountPerMember } from "./types";
import { array } from "./array";
import { COURT_CAPACITY } from "./consts";

export type CountPerMember = Record<number, number>;

export function toHistoryKey(members: GameMembers): string {
	return array.sortMatrix(members).flat().join(",");
}

export function makeHistoryKeys(settings: CurrentSettings): Set<string> {
	return new Set(settings.histories.map((history) => toHistoryKey(history.members)));
}

export function selectRandomMembers({
	courtCount,
	members,
}: {
	courtCount: number;
	members: number[];
}): GameMembers {
	const playMembers = array.shuffle(members).slice(0, courtCount * COURT_CAPACITY);
	return array.sortInnerItems(array.chunks(playMembers, COURT_CAPACITY)) as GameMembers;
}

export function rotateFirstHistory(settings: CurrentSettings): CurrentSettings {
	const newSettings = structuredClone(settings);
	const [first, ...histories] = newSettings.histories;
	newSettings.histories = [...histories, first];
	return newSettings;
}

export function getLatestMembers({ histories }: Pick<CurrentSettings, "histories">) {
	if (histories.length === 0) return;
	const history = histories[histories.length - 1];
	return structuredClone(history.members);
}

export function getRestMembers({ members }: { members: number[] }, current: GameMembers): number[] {
	const playMembers = current.flat();
	return members.filter((id) => !playMembers.includes(id));
}

// 履歴を直近から走査し、連続で休憩している回数を算出する
export function getContinuousRestCount(histories: History[], memberId: number): number {
	const lastIndex = histories.findLastIndex((history) => history.members.flat().includes(memberId));
	return histories.length - 1 - lastIndex;
}

// 最後の履歴を削除してプレイ回数を再計算する
export function removeLatestHistory(settings: CurrentSettings) {
	const newSettings = structuredClone(settings);
	const latestHistory = newSettings.histories.pop()!;
	newSettings.gameCounts = decrement(newSettings.gameCounts, latestHistory.members);
	return newSettings;
}

function decrement(gameCounts: PlayCountPerMember, members: GameMembers): PlayCountPerMember {
	const result = { ...gameCounts };
	for (const id of members.flat()) {
		const playCount = Math.max(0, (result[id]?.playCount || 0) - 1);
		const baseCount = result[id]?.baseCount || 0;
		result[id] = { playCount, baseCount };
	}
	return result;
}
