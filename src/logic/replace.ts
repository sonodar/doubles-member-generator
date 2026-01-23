import { addHistory } from "./generate";
import type { CurrentSettings, GameMembers } from "./types";
import { removeLatestHistory } from "./util";

export function replace(settings: CurrentSettings, gameMembers: GameMembers): CurrentSettings {
	if (settings.histories.length === 0) {
		return addHistory(settings, gameMembers);
	}
	const previousSettings = removeLatestHistory(settings);
	return addHistory(previousSettings, gameMembers);
}
