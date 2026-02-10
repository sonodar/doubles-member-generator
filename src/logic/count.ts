import { match } from "ts-pattern";
import { array } from "./array";
import type { CurrentSettings, History, PlayCountPerMember } from "./types";
import type { CountPerMember } from "./util";
import { getContinuousRestCount, getLatestMembers, getRestMembers } from "./util";

export const memberCountVariants = ["playCount", "restCount", "totalRestCount"] as const;
export type MemberCountVariant = (typeof memberCountVariants)[number];

export const memberCountVariantLabels: Record<MemberCountVariant, string> = {
	playCount: "総プレイ",
	restCount: "連続休憩",
	totalRestCount: "総休憩",
};

const outlierLevels = ["none", "low", "medium", "high"] as const;
export type OutlierLevel = (typeof outlierLevels)[number];

function toPlayCountPerMember(gameCounts: PlayCountPerMember): CountPerMember {
	return Object.fromEntries(Object.entries(gameCounts).map(([id, counts]) => [id, counts.playCount]));
}

function toEffectivePlayCountPerMember(gameCounts: PlayCountPerMember): CountPerMember {
	return Object.fromEntries(
		Object.entries(gameCounts).map(([id, counts]) => [id, counts.playCount + counts.baseCount]),
	);
}

function getAllCounts(members: number[], counts: CountPerMember) {
	return members.map((id) => counts[id] || 0);
}

function getContinuousRestCounts({
	members,
	histories,
	gameCounts,
}: Pick<CurrentSettings, "histories" | "members" | "gameCounts">) {
	const lastMembers = getLatestMembers({ histories });
	const restMembers = lastMembers ? getRestMembers({ members }, lastMembers) : [];
	return restMembers.reduce((counts, id) => {
		const joinedAt = gameCounts[id]?.joinedAt ?? 0;
		counts[id] = getContinuousRestCount(histories, id, joinedAt);
		return counts;
	}, {} as CountPerMember);
}

function getTotalRestCount(histories: History[], memberId: number, joinedAt: number): number {
	const relevant = histories.slice(joinedAt);
	return relevant.filter((history) => !history.members.flat().includes(memberId)).length;
}

function getTotalRestCounts({
	members,
	histories,
	gameCounts,
}: Pick<CurrentSettings, "histories" | "members" | "gameCounts">) {
	return members.reduce((counts, id) => {
		const joinedAt = gameCounts[id]?.joinedAt ?? 0;
		counts[id] = getTotalRestCount(histories, id, joinedAt);
		return counts;
	}, {} as CountPerMember);
}

function getOutlierLevel(diff: number): OutlierLevel {
	const level = Math.min(diff, 3);
	if (level >= 3) return "high";
	if (level >= 2) return "medium";
	if (level >= 1) return "low";
	return "none";
}

export function OutlierLevelProvider(settings: Pick<CurrentSettings, "histories" | "members" | "gameCounts">) {
	const playCounts = toPlayCountPerMember(settings.gameCounts);
	const effectivePlayCounts = toEffectivePlayCountPerMember(settings.gameCounts);
	const effectivePlayCountMedian = array.median(getAllCounts(settings.members, effectivePlayCounts));

	const continuousRestCounts = getContinuousRestCounts(settings);

	const totalRestCounts = getTotalRestCounts(settings);
	const totalRestCountMedian = array.median(getAllCounts(settings.members, totalRestCounts));

	const getValue = (variant: MemberCountVariant, memberId: number): number =>
		match(variant)
			.with("restCount", () => continuousRestCounts[memberId] || 0)
			.with("playCount", () => playCounts[memberId] || 0)
			.with("totalRestCount", () => totalRestCounts[memberId] || 0)
			.exhaustive();

	const getLevel = (variant: MemberCountVariant, memberId: number): OutlierLevel => {
		const diff = match(variant)
			.with("restCount", () => getValue(variant, memberId))
			.with("playCount", () => Math.abs((effectivePlayCounts[memberId] || 0) - effectivePlayCountMedian))
			.with("totalRestCount", () => getValue(variant, memberId) - totalRestCountMedian)
			.exhaustive();
		return getOutlierLevel(diff);
	};

	return { getLevel, getValue };
}
