import { array } from "./array";
import { COURT_CAPACITY } from "./consts";
import type { CurrentSettings, GameMembers, MemberId } from "./types";
import { selectRandomMembers } from "./util";

type SplitMembers = {
	played: MemberId[];
	notPlayed: MemberId[];
};

// ばらつき重視の場合は参加ゼロ回のメンバーだけ優先してそれ以外はランダム選出
export function getDiscretenessRandomMembers({ courtCount, ...settings }: CurrentSettings): GameMembers {
	const { played, notPlayed } = splitPlayedMembers(settings);
	const playMembers = notPlayed.concat(array.shuffle(played)).slice(0, courtCount * COURT_CAPACITY);
	return selectRandomMembers({ courtCount, members: playMembers });
}

// 参加なしのメンバーとそうでないメンバーとで分割
function splitPlayedMembers({ histories, members, gameCounts }: Omit<CurrentSettings, "courtCount">): SplitMembers {
	if (histories.length === 0) {
		return { played: [], notPlayed: members };
	}
	return members.reduce(
		(splitMembers, id) => {
			const count = gameCounts[id];
			if (!count || !count.playCount) {
				splitMembers.notPlayed.push(id);
			} else {
				splitMembers.played.push(id);
			}
			return splitMembers;
		},
		{ played: [], notPlayed: [] } as SplitMembers,
	);
}
