import {
  array,
  type CountPerMember,
  type CurrentSettings,
  getContinuousRestCounts,
  getTotalRestCounts,
  type PlayCountPerMember,
} from "@doubles-member-generator/manager";
import { match } from "ts-pattern";

export const memberCountVariants = [
  "playCount",
  "restCount",
  "totalRestCount",
] as const;
export type MemberCountVariant = (typeof memberCountVariants)[number];

export const memberCountVariantLabels: Record<MemberCountVariant, string> = {
  playCount: "総プレイ",
  restCount: "連続休憩",
  totalRestCount: "総休憩",
};

const outlierLevels = ["none", "low", "medium", "high"] as const;
export type OutlierLevel = (typeof outlierLevels)[number];

function toCountPerMember(gameCounts: PlayCountPerMember): CountPerMember {
  return Object.fromEntries(
    Object.entries(gameCounts).map(([id, counts]) => [id, counts.playCount]),
  );
}

function getAllCounts(members: number[], counts: CountPerMember) {
  return members.map((id) => counts[id] || 0);
}

function getOutlierLevel(diff: number): OutlierLevel {
  const level = Math.min(diff, 3);
  if (level >= 3) return "high";
  if (level >= 2) return "medium";
  if (level >= 1) return "low";
  return "none";
}

export function OutlierLevelProvider(
  settings: Pick<CurrentSettings, "histories" | "members" | "gameCounts">,
) {
  const playCounts = toCountPerMember(settings.gameCounts);
  const playCountMedian = array.median(
    getAllCounts(settings.members, playCounts),
  );

  const continuousRestCounts = getContinuousRestCounts(settings);

  const totalRestCounts = getTotalRestCounts(settings);
  const totalRestCountMedian = array.median(
    getAllCounts(settings.members, totalRestCounts),
  );

  const getValue = (variant: MemberCountVariant, memberId: number): number =>
    match(variant)
      .with("restCount", () => continuousRestCounts[memberId] || 0)
      .with("playCount", () => playCounts[memberId] || 0)
      .with("totalRestCount", () => totalRestCounts[memberId] || 0)
      .exhaustive();

  const getLevel = (
    variant: MemberCountVariant,
    memberId: number,
  ): OutlierLevel => {
    const diff = match(variant)
      .with("restCount", () => getValue(variant, memberId))
      .with("playCount", () =>
        Math.abs(getValue(variant, memberId) - playCountMedian),
      )
      .with(
        "totalRestCount",
        () => getValue(variant, memberId) - totalRestCountMedian,
      )
      .exhaustive();
    return getOutlierLevel(diff);
  };

  return { getLevel, getValue };
}
