import { array } from "./array";
import type { CurrentSettings, GameMembers, PlayCountPerMember } from "./types";
import { COURT_CAPACITY } from "./consts";
import { toHistoryKey } from "./util";

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
    return addHistory(settings, getRandomMembers(settings));
  }

  const combinationCount = calcCombination(
    settings.courtCount,
    settings.members.length,
  );

  // 履歴数が組み合わせ数以上の場合は、これ以上ランダムに選出しても意味がないため
  // ランダム選出を終了し、履歴を最初から繰り返す
  if (settings.histories.length >= combinationCount) {
    console.log(
      `履歴数(${settings.histories.length})が組み合わせ数(${combinationCount})に達したため最も古い履歴を選出`,
    );
    const newSettings = structuredClone(settings);
    newSettings.histories.push(newSettings.histories.shift()!);
    return newSettings;
  }

  const historyKeys = new Set(
    settings.histories.map((history) => toHistoryKey(history.members)),
  );
  const generatedMembers: SortableMembers[] = [];

  // メンバー数の 10 倍か、最大組み合わせ数 - 履歴数のどちらか小さい方の数だけ組み合わせを払い出す (最大 320)
  const generateSize = Math.min(
    settings.members.length * 10,
    combinationCount - settings.histories.length,
  );

  while (generatedMembers.length < generateSize) {
    // とりあえず適当に払い出す
    const generated = getRandomMembers(settings);

    // 履歴にすでに同じ組み合わせがあったらやり直し
    if (historyKeys.has(toHistoryKey(generated))) {
      console.log(`${JSON.stringify(generated)} は既出のためやり直し`);
      continue;
    }

    // gameCounts のコピーを作成し、参加メンバーの参加回数を 1 ずつ増やす
    // あくまで標準偏差などの計算用で、インスタンスの gameCounts は直接増やさない
    const incremented = increment(settings.gameCounts, generated);

    // すでにいない人のカウントは参照しないように除外
    // 遅れて参加したメンバーには補正値を加算する
    const playCounts = Object.entries(incremented)
      .filter(([id]) => settings.members.includes(Number(id)))
      .map(([_, { playCount, baseCount }]) => baseCount + playCount);

    // 参加メンバーの参加回数の標準偏差を算出（あとでソートに使う）
    const dev = array.standardDeviation(playCounts);

    // 最大値と最小値の差を求めておく（あとでソートに使う）
    const range = array.range(playCounts);

    // 編集距離の平均を求めておく（あとでソートに使う）
    const dist = averageEditDistance(settings.histories, generated);

    generatedMembers.push({ members: generated, dev, dist, range });
  }

  // 最大最小の差が最小で、編集距離が最大のものを選出する (編集距離が同じ場合は標準偏差が小さいものを選出する)
  generatedMembers.sort(sortableMembersComparator);

  return addHistory(settings, generatedMembers[0].members);
}

function getRandomMembers({ courtCount, members }: CurrentSettings) {
  const randomMembers = array
    .shuffle(members)
    .slice(0, courtCount * COURT_CAPACITY);
  const membersPerCourt = array.chunks(randomMembers, COURT_CAPACITY);
  return array.sortInnerItems(membersPerCourt) as GameMembers;
}

export function addHistory(
  settings: CurrentSettings,
  members: GameMembers,
): CurrentSettings {
  const newSettings = structuredClone(settings);
  newSettings.histories.push({ members });
  newSettings.gameCounts = increment(settings.gameCounts, members);
  return newSettings;
}

export const replayGenerate = addHistory;

function averageEditDistance(
  histories: CurrentSettings["histories"],
  members: GameMembers,
): number {
  return array.average(
    histories
      .filter((history) => !history.deleted)
      .map((history) => array.editDistance2D(history.members, members)),
  );
}

function increment(
  gameCounts: PlayCountPerMember,
  members: GameMembers,
): PlayCountPerMember {
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

  result *= binomialCoefficient(
    memberCount - COURT_CAPACITY * courtCount,
    memberCount % COURT_CAPACITY,
  );
  return result;
}