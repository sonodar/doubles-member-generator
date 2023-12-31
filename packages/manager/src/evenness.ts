import type {
  CurrentSettings,
  GameMembers,
  MemberId,
  PlayCountPerMember,
} from "./types";
import { array } from "./array";
import { COURT_CAPACITY } from "./consts";
import {
  type CountPerMember,
  getContinuousRestCounts,
  getRestMembers,
  selectRandomMembers,
} from "./util";

// 均等性重視の場合は参加回数でソートして少ない順に選出
export function getEvennessRandomMembers({
  courtCount,
  ...settings
}: CurrentSettings): GameMembers {
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
  const exactlyPlayMemberIds = playMembers
    .filter(({ count }) => count < threshold)
    .map(id);

  // 必ず参加できるかどうかグレーなメンバー
  const sameCountMemberIds = members
    .filter(({ count }) => count === threshold)
    .map(id);

  // 最終的なメンバーは必ず参加可能なメンバー + 同回数のメンバー内からランダム選出されたメンバー
  const finallySelectedMembers = exactlyPlayMemberIds
    .concat(array.shuffle(sameCountMemberIds))
    .slice(0, courtCount * COURT_CAPACITY);

  return selectRandomMembers({ courtCount, members: finallySelectedMembers });
}

// 参加回数でメンバーをソート
function sortMembers({
  members,
  gameCounts,
}: Pick<CurrentSettings, "members" | "gameCounts">): CountPerMember[] {
  return members
    .map((id) => ({ id, count: getPlayCount(gameCounts, id) }))
    .sort((i1, i2) => i1.count - i2.count);
}

function getPlayCount(gameCounts: PlayCountPerMember, id: MemberId) {
  return (gameCounts[id]?.playCount || 0) + (gameCounts[id]?.baseCount || 0);
}

function id(item: CountPerMember) {
  return item.id;
}

function getRandomMembers(courtCount: number, members: CountPerMember[]) {
  return selectRandomMembers({ courtCount, members: members.map(id) });
}

export function isEvenness(
  { members, histories }: Pick<CurrentSettings, "members" | "histories">,
  surplusLimit: number,
  generated: GameMembers,
) {
  const restMembers = getRestMembers({ members }, generated);
  const restCounts = getContinuousRestCounts(histories, restMembers);
  return !restCounts.some(({ count }) => count > surplusLimit);
}
