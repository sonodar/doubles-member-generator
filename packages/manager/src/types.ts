export type MemberId = number;
export type CourtMembers = [MemberId, MemberId, MemberId, MemberId];
export type GameMembers = CourtMembers[];
export type History = {
  members: GameMembers;
  restMembers: MemberId[];
  deleted?: true;
};
export type PlayCount = { playCount: number; baseCount: number };
export type PlayCountPerMember = Record<MemberId, PlayCount>;
export type RandomMode = "DISCRETENESS" | "EVENNESS";

export type CurrentSettings = {
  courtCount: number;
  members: MemberId[];
  histories: History[];
  gameCounts: PlayCountPerMember;
  randomMode: RandomMode;
};
