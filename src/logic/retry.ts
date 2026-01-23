import { addHistory, generate } from "./generate";
import type { CurrentSettings, GameMembers } from "./types";
import { getLatestMembers, removeLatestHistory, toHistoryKey } from "./util";

export function retry(settings: CurrentSettings): CurrentSettings {
	if (settings.histories.length === 0) {
		throw new Error("履歴がないためリトライできません");
	}

	const latestMembers = getLatestMembers(settings)!;
	const previousSettings = removeLatestHistory(settings);

	const newSettings = generate(previousSettings);
	const members = getLatestMembers(newSettings)!;

	// 同じだったらリトライの意味がないので再帰
	if (toHistoryKey(latestMembers) === toHistoryKey(members)) {
		return retry(settings);
	}

	return newSettings;
}

export function replayRetry(settings: CurrentSettings, members: GameMembers) {
	const prevSettings = removeLatestHistory(settings);
	return addHistory(prevSettings, members);
}
