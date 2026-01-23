import { emptySettings, previousSettingsAtom, settingsAtom } from "@components/state";
import { type Algorithm, Algorithms, type CourtMembers, type CurrentSettings, type History } from "@logic";
import type { WritableAtom } from "jotai";

// biome-ignore lint/suspicious/noExplicitAny: jotai の型定義に合わせる必要がある
type AnyWritableAtom = WritableAtom<unknown, any[], any>;
type AtomTuple = readonly [AnyWritableAtom, unknown];

interface GameInProgressOptions {
	courtCount: number;
	memberCount: number;
	historyCount: number;
	algorithm?: Algorithm;
}

function generateMembers(count: number): number[] {
	return Array.from({ length: count }, (_, i) => i + 1);
}

function generateHistory(members: number[], courtCount: number): History {
	const gameMembers: CourtMembers[] = [];
	for (let i = 0; i < courtCount; i++) {
		const startIdx = i * 4;
		gameMembers.push([
			members[startIdx] ?? 0,
			members[startIdx + 1] ?? 0,
			members[startIdx + 2] ?? 0,
			members[startIdx + 3] ?? 0,
		]);
	}
	return {
		members: gameMembers,
		time: new Date().toISOString(),
	};
}

export const StatePresets = {
	/**
	 * 初期状態（courtCount=0、ゲーム未開始）
	 */
	emptyState(): AtomTuple[] {
		return [[settingsAtom, emptySettings]];
	},

	/**
	 * ゲーム進行中状態
	 */
	gameInProgress(options: GameInProgressOptions): AtomTuple[] {
		const { courtCount, memberCount, historyCount, algorithm = Algorithms.DISCRETENESS } = options;
		const members = generateMembers(memberCount);
		const histories: History[] = [];

		for (let i = 0; i < historyCount; i++) {
			histories.push(generateHistory(members, courtCount));
		}

		const settings: CurrentSettings = {
			courtCount,
			members,
			histories,
			gameCounts: {},
			algorithm,
		};

		return [[settingsAtom, settings]];
	},

	/**
	 * 前回設定あり状態
	 */
	withPreviousSettings(previous: CurrentSettings): AtomTuple[] {
		return [
			[settingsAtom, emptySettings],
			[previousSettingsAtom, previous],
		];
	},

	/**
	 * 休憩メンバーなし状態（メンバー数 = コート数×4）
	 */
	noRestMembers(courtCount: number): AtomTuple[] {
		const memberCount = courtCount * 4;
		return this.gameInProgress({
			courtCount,
			memberCount,
			historyCount: 0,
		});
	},

	/**
	 * 休憩メンバーあり状態（メンバー数 > コート数×4）
	 */
	withRestMembers(courtCount: number, restCount: number): AtomTuple[] {
		const memberCount = courtCount * 4 + restCount;
		return this.gameInProgress({
			courtCount,
			memberCount,
			historyCount: 0,
		});
	},
};
