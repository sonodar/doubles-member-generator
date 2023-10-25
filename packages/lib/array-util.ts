export function shuffle(array: number[]): number[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function splitChunks(array: number[], chunkSize: number): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

export function sortMatrixItems(array: number[][]): number[][] {
    return array.map((items) => [...items].sort((a, b) => a - b));
}

function sum(array: number[]): number {
    return array.reduce((sum, current) => sum + current, 0);
}

// 二次元配列の編集距離を求める
export function calculateEditDistance(arr1: number[][], arr2: number[][]): number {
    // 二次元配列を要素の合計値(合計が同じ場合は先頭値)でソートする
    function sortMatrixBySumOrFirst(array: number[][]): number[][] {
        return array.sort((a, b) => {
            const sumA = sum(a);
            const sumB = sum(b);
            if (sumA === sumB) {
                return a[0] - b[0];
            }
            return sumA - sumB;
        });
    }

    // 二次元配列をソートする
    function sortMatrix(matrix: number[][]): number[][] {
        return sortMatrixBySumOrFirst(sortMatrixItems(matrix));
    }

    return _calculateEditDistance(sortMatrix(arr1).flat(), sortMatrix(arr2).flat());
}

function _calculateEditDistance(arr1: number[], arr2: number[]): number {
    const m = arr1.length;
    const n = arr2.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
        dp[i] = [];
        dp[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (arr1[i - 1] === arr2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
            }
        }
    }

    return dp[m][n];
}

// 標準偏差
export function standardDeviation(array: number[]): number {
    if (!array.length) return 0;
    const avg = average(array);
    const deviation = array.map((x) => (x - avg) ** 2);
    const variance = average(deviation);
    return Math.sqrt(variance);
}

// 算術平均を求める (暫定で最頻値、中央値よりもこれ)
export function average(array: number[]): number {
    if (!array.length) return 0;
    return sum(array) / array.length;
}

// 最頻値を求める (未使用: 平均とどちらがいいか)
export function mode(
    array: number[],
    ifIsEquals: (a: number, b: number) => number = (a, b) => (a > b ? a : b),
): number {
    const counts = array.reduce((acc, item) => acc.set(item, (acc.get(item) || 0) + 1), new Map<number, number>());

    const { maxItem } = Array.from(counts.entries()).reduce(
        (acc, [item, count]) => {
            if (acc.maxCount < count) {
                acc.maxCount = count;
                acc.maxItem = item;
            } else if (acc.maxCount === count) {
                acc.maxItem = ifIsEquals(acc.maxItem, item);
            }
            return acc;
        },
        { maxCount: 0, maxItem: null },
    );

    return maxItem;
}

// 中央値を求める (未使用: 平均とどちらがいいか)
export function median(array: number[]): number {
    if (!array.length) return 0;
    const centerIndex = Math.floor(array.length / 2);
    const sorted = [...array].sort((a, b) => a - b);
    if (array.length % 2 === 0) {
        return (sorted[centerIndex - 1] + sorted[centerIndex]) / 2;
    }
    return sorted[centerIndex];
}

// 数値配列の最大値と最小値の差を求める
export function diffMinToMax(array: number[]): number {
    if (!array.length) return 0;
    return Math.max(...array) - Math.min(...array);
}
