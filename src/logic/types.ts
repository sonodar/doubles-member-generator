export type MemberId = number;
export type CourtMembers = [MemberId, MemberId, MemberId, MemberId];
export type GameMembers = CourtMembers[];
export type History = {
	members: GameMembers;
	time: string;
	deleted?: true;
};
export type PlayCount = { playCount: number; baseCount: number; joinedAt?: number };
export type PlayCountPerMember = Record<MemberId, PlayCount>;

export const Algorithms = {
	DISCRETENESS: "discreteness",
	EVENNESS: "evenness",
} as const;

export type Algorithm = (typeof Algorithms)[keyof typeof Algorithms];

export type CurrentSettings = {
	courtCount: number;
	members: MemberId[];
	histories: History[];
	gameCounts: PlayCountPerMember;
	algorithm: Algorithm;
};
