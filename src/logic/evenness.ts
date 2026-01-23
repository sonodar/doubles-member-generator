import { array } from "./array";
import { COURT_CAPACITY } from "./consts";
import type { CurrentSettings, GameMembers, MemberId, PlayCountPerMember } from "./types";
import { getContinuousRestCount, getRestMembers, selectRandomMembers } from "./util";

type PlayCount = { id: number; count: number };

// 均等性重視の場合は参加回数でソートして少ない順に選出
export function getEvennessRandomMembers({ courtCount, ...settings }: CurrentSettings): GameMembers {
	const members = sortMembers(settings);

	const playMembers = members.slice(0, courtCount * COURT_CAPACITY);
	const restMembers = members.slice(playMembers.length);

	if (restMembers.length === 0) {
		return getRandomMembers(courtCount, playMembers);
	}

	const lastPlayMember = playMembers[playMembers.length - 1];
	const [firstRestMember] = restMembers;

	// 選出メンバーの末尾と休憩メンバーの先頭がきれいに分かれていたら選出メンバーをそのまま返す
	if (lastPlayMember.count < firstRestMember.count) {
		return getRandomMembers(courtCount, playMembers);
	}

	// 末尾と先頭が同じ値だったらその回数値のメンバーを洗い出す
	const threshold = lastPlayMember.count;

	// 絶対に参加可能なメンバー
	const exactlyPlayMemberIds = playMembers.filter(({ count }) => count < threshold).map(id);

	// 必ず参加できるかどうかグレーなメンバー
	const sameCountMemberIds = members.filter(({ count }) => count === threshold).map(id);

	// 最終的なメンバーは必ず参加可能なメンバー + 同回数のメンバー内からランダム選出されたメンバー
	const finallySelectedMembers = exactlyPlayMemberIds
		.concat(array.shuffle(sameCountMemberIds))
		.slice(0, courtCount * COURT_CAPACITY);

	return selectRandomMembers({ courtCount, members: finallySelectedMembers });
}

// 参加回数でメンバーをソート
function sortMembers({ members, gameCounts }: Pick<CurrentSettings, "members" | "gameCounts">): PlayCount[] {
	return members.map((id) => ({ id, count: getPlayCount(gameCounts, id) })).sort((i1, i2) => i1.count - i2.count);
}

function getPlayCount(gameCounts: PlayCountPerMember, id: MemberId) {
	return (gameCounts[id]?.playCount || 0) + (gameCounts[id]?.baseCount || 0);
}

function id(item: PlayCount) {
	return item.id;
}

function getRandomMembers(courtCount: number, members: PlayCount[]) {
	return selectRandomMembers({ courtCount, members: members.map(id) });
}

/**
 * @param threshold 連続で休憩している回数のしきい値
 * @param generated ランダム選出されたメンバーの配列
 * @returns
 */
export function isEvenness(
	{ members, histories }: Pick<CurrentSettings, "members" | "histories">,
	threshold: number,
	generated: GameMembers,
) {
	const restMembers = getRestMembers({ members }, generated);
	for (const memberId of restMembers) {
		const count = getContinuousRestCount(histories, memberId) + 1; // 今回休憩の 1 を追加
		if (count > threshold) {
			return false;
		}
	}
	return true;
}
