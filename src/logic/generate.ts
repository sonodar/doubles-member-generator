import { array } from "./array";
import { COURT_CAPACITY } from "./consts";
import { getDiscretenessRandomMembers } from "./discreteness";
import { getEvennessRandomMembers, isEvenness } from "./evenness";
import type { CurrentSettings, GameMembers, MemberId, PlayCountPerMember } from "./types";
import { Algorithms } from "./types";
import { makeHistoryKeys, rotateFirstHistory, selectRandomMembers, toHistoryKey } from "./util";

// ソート用のプロパティを持ったオブジェクトの配列
type SortableMembers = {
	members: GameMembers;
	dev: number;
	dist: number;
	range: number;
};

function sortableMembersComparator(a: SortableMembers, b: SortableMembers) {
	if (a.range === b.range) {
		if (a.dist === b.dist) {
			return a.dev - b.dev;
		}
		return b.dist - a.dist;
	}
	return a.range - b.range;
}

export function generate(settings: CurrentSettings): CurrentSettings {
	// 履歴がない場合はランダムに選出する
	if (settings.histories.length === 0) {
		return addHistory(settings, selectRandomMembers(settings));
	}

	// すべての組み合わせの数を算出
	const combinationCount = calcCombination(settings.courtCount, settings.members.length);

	// 履歴数が組み合わせ数以上の場合は、これ以上ランダムに選出しても意味がないため
	// ランダム選出を終了し、履歴を最初から繰り返す
	if (settings.histories.length >= combinationCount) {
		console.log(
			`履歴数(${settings.histories.length})が組み合わせ数(${combinationCount})に達したため最も古い履歴を選出`,
		);
		return rotateFirstHistory(settings);
	}

	// 最大組み合わせ数 - 履歴数の数だけ組み合わせを払い出す (上限 20)
	const generateSize = Math.min(20, combinationCount - settings.histories.length);

	const historyKeys = makeHistoryKeys(settings);

	// 均等モードにおける連続休憩回数の許容回数
	const restLimit = getContinuousRestCountLimit(settings);

	// ばらつきモードにおけるプレイ回数の差の許容値
	const diffLimit = restLimit + 1;

	const generatedMembers: SortableMembers[] = [];

	let retryCount = 0;

	while (generatedMembers.length < generateSize) {
		// まずメンバーをランダム選出（アルゴリズム設定によって選出方法が異なる）
		const generated = getRandomMembers(settings);

		// 履歴にすでに同じ組み合わせがあったらやり直し
		if (historyKeys.has(toHistoryKey(generated))) {
			console.log(`${JSON.stringify(generated)} は既出のためやり直し`);
			retryCount++;
			continue;
		}

		// gameCounts のコピーを作成し、参加メンバーの参加回数を 1 ずつ増やす
		// あくまで標準偏差などの計算用で、インスタンスの gameCounts は直接増やさない
		const incremented = increment(settings.gameCounts, generated);

		// 参加回数のみの配列（計算に使用する）
		const playCounts = getAllPlayCount(settings.members, incremented);

		// 最大値と最小値の差を求める
		const range = array.range(playCounts);

		// 100 回やり直してもダメなら諦める
		if (retryCount > 100) {
			console.log("100 回やり直してもダメなためやり直しをやめる");
			generatedMembers.push({
				members: generated,
				dev: array.standardDeviation(playCounts),
				dist: averageEditDistance(settings.histories, generated),
				range,
			});
			continue;
		}

		switch (settings.algorithm) {
			case Algorithms.EVENNESS:
				// 均等モードの場合、連続休憩回数が許容回数を超える場合はやり直し
				if (!isEvenness(settings, restLimit, generated)) {
					console.log(`連続休憩回数が上限である${restLimit}回を超えたメンバーがいるためやり直し`);
					retryCount++;
					historyKeys.add(toHistoryKey(generated));
					continue;
				}
				break;
			case Algorithms.DISCRETENESS:
				if (range > diffLimit) {
					console.log(`プレイ回数の差が ${range} で上限の ${diffLimit} より大きいためやり直し`);
					historyKeys.add(toHistoryKey(generated));
					retryCount++;
					continue;
				}
				break;
		}

		// 参加メンバーの参加回数の標準偏差を算出（あとでソートに使う）
		const dev = array.standardDeviation(playCounts);

		// 編集距離の平均を求めておく（あとでソートに使う）
		const dist = averageEditDistance(settings.histories, generated);

		generatedMembers.push({ members: generated, dev, dist, range });
	}

	// 最大最小の差が最小で、編集距離が最大のものを選出する (編集距離が同じ場合は標準偏差が小さいものを選出する)
	generatedMembers.sort(sortableMembersComparator);

	return addHistory(settings, generatedMembers[0].members);
}

function getRandomMembers(settings: CurrentSettings) {
	switch (settings.algorithm) {
		case Algorithms.DISCRETENESS:
			return getDiscretenessRandomMembers(settings);
		case Algorithms.EVENNESS:
			return getEvennessRandomMembers(settings);
		default: // 旧バージョンの設定が localStorage に残っている場合にありうる
			return getDiscretenessRandomMembers(settings);
	}
}

export function addHistory(settings: CurrentSettings, members: GameMembers): CurrentSettings {
	const newSettings = structuredClone(settings);
	newSettings.histories.push({ members, time: new Date().toLocaleString() });
	newSettings.gameCounts = increment(settings.gameCounts, members);
	return newSettings;
}

export const replayGenerate = addHistory;

function averageEditDistance(histories: CurrentSettings["histories"], members: GameMembers): number {
	return array.average(
		histories.filter((history) => !history.deleted).map((history) => array.editDistance2D(history.members, members)),
	);
}

function increment(gameCounts: PlayCountPerMember, members: GameMembers): PlayCountPerMember {
	const result = structuredClone(gameCounts);
	for (const id of members.flat()) {
		const playCount = (result[id]?.playCount || 0) + 1;
		const baseCount = result[id]?.baseCount || 0;
		result[id] = { playCount, baseCount };
	}
	return result;
}

// コートとメンバーの全組み合わせ数を返す関数
function calcCombination(courtCount: number, memberCount: number): number {
	// 二項係数を返す関数
	function binomialCoefficient(n: number, k: number): number {
		let result = 1;
		for (let i = 1; i <= k; i++) {
			result *= n - k + i;
			result /= i;
		}
		return result;
	}

	let result = 1;
	for (let i = 0; i < courtCount; i++) {
		result *=
			(memberCount - i * COURT_CAPACITY) *
			(memberCount - i * COURT_CAPACITY - 1) *
			(memberCount - i * COURT_CAPACITY - 2) *
			(memberCount - i * COURT_CAPACITY - 3);
		result /= 24;
	}

	// 1000 超えたらあんまり意味ないので早々に return
	if (result >= 1000) {
		return result;
	}

	result *= binomialCoefficient(memberCount - COURT_CAPACITY * courtCount, memberCount % COURT_CAPACITY);
	return result;
}

// 連続休憩回数の許容回数を算出する
// (余剰メンバー数 / 4)の切り上げ: 3 => 1, 4 => 1, 5 => 2, 0 => 0
function getContinuousRestCountLimit(settings: CurrentSettings) {
	const maxPlayerCount = settings.courtCount * COURT_CAPACITY;
	const surplusCount = settings.members.length - maxPlayerCount;
	return Math.ceil(surplusCount / COURT_CAPACITY);
}

// メンバー全員の参加回数を返す（どのメンバーの回数かという情報は削除）
// すでにいない人のカウントは参照しないように除外
// 遅れて参加したメンバーには補正値を加算する
function getAllPlayCount(members: MemberId[], gameCounts: PlayCountPerMember): number[] {
	return members
		.map((id) => gameCounts[id])
		.filter(Boolean)
		.map((c) => (c.playCount || 0) + (c.baseCount || 0));
}
