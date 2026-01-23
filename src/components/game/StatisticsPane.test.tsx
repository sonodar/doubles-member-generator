import { Algorithms, type CourtMembers, type CurrentSettings } from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "../../testing/utils";
import { StatisticsPane } from "./StatisticsPane";

describe("StatisticsPane", () => {
	const mockOnAdjusted = vi.fn();

	beforeEach(() => {
		mockOnAdjusted.mockClear();
	});

	const courtMembers: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];

	const settingsWithHistory: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
		histories: [
			{
				members: courtMembers,
				time: "2026-01-21T10:00:00+09:00",
			},
		],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	describe("基本表示", () => {
		it("履歴がある場合、履歴パネルが表示される", () => {
			render(<StatisticsPane settings={settingsWithHistory} onAdjusted={mockOnAdjusted} />);

			// 今回 のラベルが表示される
			expect(screen.getByText("今回")).toBeInTheDocument();
		});
	});

	describe("プレイ回数確認ボタン", () => {
		it("休憩メンバーがいる場合、プレイ回数確認ボタンが表示される", () => {
			render(<StatisticsPane settings={settingsWithHistory} onAdjusted={mockOnAdjusted} />);

			// メンバー数(10) > コート数(2) * 4 = 8 なので表示される
			expect(screen.getByRole("button", { name: /プレイ回数を確認する/i })).toBeInTheDocument();
		});

		it("休憩メンバーがいない場合、プレイ回数確認ボタンは表示されない", () => {
			const settingsNoRest: CurrentSettings = {
				...settingsWithHistory,
				members: [1, 2, 3, 4, 5, 6, 7, 8], // ちょうど 2コート分
			};

			render(<StatisticsPane settings={settingsNoRest} onAdjusted={mockOnAdjusted} />);

			expect(screen.queryByRole("button", { name: /プレイ回数を確認する/i })).not.toBeInTheDocument();
		});
	});
});
