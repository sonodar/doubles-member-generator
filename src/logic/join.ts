import { array } from "./array";
import type { CurrentSettings } from "./types";

export function join(settings: CurrentSettings): CurrentSettings {
	const newSettings = structuredClone(settings);

	const newId = Math.max(...newSettings.members) + 1;
	newSettings.members.push(newId);

	// 参加時点での最頻プレイ回数を補正値として保持する
	const baseCount = array.mode(Object.values(newSettings.gameCounts).map(({ playCount }) => playCount));

	newSettings.gameCounts[newId] = { playCount: 0, baseCount, joinedAt: newSettings.histories.length };

	return newSettings;
}
