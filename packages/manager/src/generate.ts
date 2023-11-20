import { array } from "./array";
import type {
  CurrentSettings,
  GameMembers,
  PlayCountPerMember,
  History,
} from "./types";
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

  // メンバー数の 10 倍か、最大組み合わせ数 - 履歴数のどちらか小さい方の数だけ組み合わせを払い出す (最大 320)
  const generateSize = Math.min(
    settings.members.length * 10,
    combinationCount - settings.histories.length,
  );

  const historyKeys = new Set(
    settings.histories.map((history) => toHistoryKey(history.members)),
  );

  const surplusLimit = getSurplusLimit(settings);
  const generatedMembers: SortableMembers[] = [];

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

    // 最大値と最小値の差を求めておく（あとでソートに使う）
    const range = array.range(playCounts);

    // 均等モードの場合の特別処置
    if (settings.algorithm === "EVENNESS") {
      // 最大値と最小値の差が 人数 / 4 (端数切り上げ) より大きかったらやり直し
      if (range > surplusLimit) {
        console.log("最大・最小の差が大きすぎる", { range, surplusLimit });
        continue;
      }

      const restMembers = getRestMembers(settings, generated);

      // 休憩メンバー内に休みすぎの人がいるかどうか
      const existsContinuousRestMember = restMembers.some((memberId) => {
        const restCount = getContinuousRestCount(settings.histories, memberId);
        if (restCount > surplusLimit) {
          console.log("休みすぎのメンバーがいる", { restCount, surplusLimit });
          return true;
        }
        return false;
      });

      // 休みすぎの人がいたらやり直し
      if (existsContinuousRestMember) {
        continue;
      }
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
  const randomMembers = getRandomTargetMembers(settings);
  const membersPerCourt = array.chunks(randomMembers, COURT_CAPACITY);
  return array.sortInnerItems(membersPerCourt) as GameMembers;
}

function getRandomTargetMembers(settings: CurrentSettings) {
  const memberCapacity = settings.courtCount * COURT_CAPACITY;

  if (settings.members.length <= memberCapacity) {
    return array.shuffle(settings.members);
  }

  const { played, notPlayed } = separatePlayedMembers(settings);
  const targetMembers = notPlayed
    .concat(array.shuffle(played))
    .slice(0, memberCapacity);

  return array.shuffle(targetMembers);
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

function getSurplusLimit(settings: CurrentSettings) {
  const surplusCount =
    settings.members.length - settings.courtCount * COURT_CAPACITY;
  return Math.ceil(surplusCount / COURT_CAPACITY);
}

function getRestMembers(
  { members }: { members: number[] },
  current: GameMembers,
): number[] {
  const playMembers = current.flat();
  return members.filter((id) => !playMembers.includes(id));
}

// 履歴を直近から走査し、連続で休憩している回数を算出する
function getContinuousRestCount(
  histories: History[],
  memberId: number,
): number {
  const lastIndex = histories.findLastIndex((history) =>
    history.members.flat().includes(memberId),
  );
  return histories.length - 1 - lastIndex;
}

function separatePlayedMembers({
  members,
  histories,
  gameCounts,
}: Omit<CurrentSettings, "courtCount">) {
  const played: number[] = [];

  if (histories.length === 0) {
    return { played, notPlayed: members };
  }

  const notPlayed: number[] = [];

  for (const [id, { playCount }] of Object.entries(gameCounts)) {
    if (playCount === 0) {
      notPlayed.push(Number(id));
    } else {
      played.push(Number(id));
    }
  }

  return { played, notPlayed };
}
