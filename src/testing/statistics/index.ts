import type { Algorithm, History, MemberId, OutlierLevel, PlayCountPerMember } from "../../logic";

// 期待値の型定義
export type ExpectedHighlightLevel = {
	playCount?: OutlierLevel;
	totalRestCount?: OutlierLevel;
	restCount?: OutlierLevel;
};

export type ExpectedWarning = {
	unfairnessWarning?: boolean;
	consecutiveRestWarning?: boolean;
	note?: string;
};

export type ExpectedMemberStats = {
	playCount: number;
	effectivePlayCount?: number;
	totalRestCount?: number;
	consecutiveRestCount?: number;
	highlightLevel?: ExpectedHighlightLevel;
	note?: string;
	warning?: ExpectedWarning;
};

export type BugDetection = {
	issue: string;
	expectedBehavior: string;
};

// 標準パターン（pattern1-11）
export type StatisticsTestData = {
	description: string;
	courtCount: number;
	members: MemberId[];
	histories: History[];
	gameCounts: PlayCountPerMember;
	algorithm: Algorithm;
	expected: Record<string, ExpectedMemberStats>;
	leftMembers?: MemberId[];
	showLeftMember?: boolean;
	note?: string;
	bugDetection?: BugDetection;
};

// アルゴリズム別パターン（pattern12）
export type AlgorithmExpected = {
	expected: Record<string, ExpectedMemberStats>;
};

export type AlgorithmTestData = {
	description: string;
	courtCount: number;
	members: MemberId[];
	histories: History[];
	gameCounts: PlayCountPerMember;
	algorithms: {
		evenness: AlgorithmExpected;
		discreteness: AlgorithmExpected;
	};
	note?: string;
};

// ヘルパー関数
export function asStatisticsTestData(json: unknown): StatisticsTestData {
	return json as StatisticsTestData;
}

export function asAlgorithmTestData(json: unknown): AlgorithmTestData {
	return json as AlgorithmTestData;
}

// テストデータのエクスポート
import pattern1Json from "./pattern1-fair-play.json";
import pattern2Json from "./pattern2-unfair-rest.json";
import pattern3Json from "./pattern3-initial-member-rest.json";
import pattern4Json from "./pattern4-all-equal.json";
import pattern5Json from "./pattern5-multiple-joiners.json";
import pattern6Json from "./pattern6-consecutive-rest.json";
import pattern7Json from "./pattern7-just-joined.json";
import pattern8Json from "./pattern8-left-member.json";
import pattern9Json from "./pattern9-over-play.json";
import pattern10Json from "./pattern10-warning.json";
import pattern11Json from "./pattern11-zero-base.json";
import pattern12Json from "./pattern12-algorithm.json";

export const pattern1 = asStatisticsTestData(pattern1Json);
export const pattern2 = asStatisticsTestData(pattern2Json);
export const pattern3 = asStatisticsTestData(pattern3Json);
export const pattern4 = asStatisticsTestData(pattern4Json);
export const pattern5 = asStatisticsTestData(pattern5Json);
export const pattern6 = asStatisticsTestData(pattern6Json);
export const pattern7 = asStatisticsTestData(pattern7Json);
export const pattern8 = asStatisticsTestData(pattern8Json);
export const pattern9 = asStatisticsTestData(pattern9Json);
export const pattern10 = asStatisticsTestData(pattern10Json);
export const pattern11 = asStatisticsTestData(pattern11Json);
export const pattern12 = asAlgorithmTestData(pattern12Json);

// 全パターンをまとめたオブジェクト
export const patterns = {
	pattern1,
	pattern2,
	pattern3,
	pattern4,
	pattern5,
	pattern6,
	pattern7,
	pattern8,
	pattern9,
	pattern10,
	pattern11,
	pattern12,
} as const;

// 標準パターンのみ（pattern12を除く）
export const standardPatterns: StatisticsTestData[] = [
	pattern1,
	pattern2,
	pattern3,
	pattern4,
	pattern5,
	pattern6,
	pattern7,
	pattern8,
	pattern9,
	pattern10,
	pattern11,
];
