import { describe, expect, it } from "vitest";
import { Algorithms, type CourtMembers, type CurrentSettings } from "../../logic";
import { fireEvent, render, screen, waitFor } from "../../testing/utils";
import { settingsAtom } from "../state";
import MemberCountPane from "./MemberCountPane";

describe("MemberCountPane", () => {
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
		gameCounts: {
			1: { playCount: 1, baseCount: 0 },
			2: { playCount: 1, baseCount: 0 },
			3: { playCount: 1, baseCount: 0 },
			4: { playCount: 1, baseCount: 0 },
			5: { playCount: 1, baseCount: 0 },
			6: { playCount: 1, baseCount: 0 },
			7: { playCount: 1, baseCount: 0 },
			8: { playCount: 1, baseCount: 0 },
			9: { playCount: 0, baseCount: 0 },
			10: { playCount: 0, baseCount: 0 },
		},
		algorithm: Algorithms.DISCRETENESS,
	};

	describe("基本表示", () => {
		it("メンバーIDとプレイ回数が表示される", async () => {
			render(<MemberCountPane settings={settingsWithHistory} />);

			// メンバーIDが表示される
			await waitFor(() => {
				expect(screen.getByText("1 :")).toBeInTheDocument();
				expect(screen.getByText("10 :")).toBeInTheDocument();
			});
		});

		it("propsなしの場合、settingsAtomから値を取得する", async () => {
			render(<MemberCountPane />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			await waitFor(() => expect(screen.getByText("1 :")).toBeInTheDocument());
		});
	});

	describe("タブ切り替え", () => {
		it("タブを切り替えられる", async () => {
			render(<MemberCountPane settings={settingsWithHistory} />);

			// 初期状態（総プレイタブ）
			const playCountTab = screen.getByRole("tab", { name: "総プレイ" });
			await waitFor(() => {
				expect(playCountTab).toHaveAttribute("aria-selected", "true");
			});

			// 連続休憩タブに切り替え
			const restCountTab = screen.getByRole("tab", { name: "連続休憩" });
			fireEvent.click(restCountTab);

			await waitFor(() => {
				expect(restCountTab).toHaveAttribute("aria-selected", "true");
			});
		});

		it("defaultTabIndexを指定できる", async () => {
			render(<MemberCountPane settings={settingsWithHistory} defaultTabIndex={1} />);

			// 連続休憩タブが初期選択されている
			const restCountTab = screen.getByRole("tab", { name: "連続休憩" });
			await waitFor(() => {
				expect(restCountTab).toHaveAttribute("aria-selected", "true");
			});
		});
	});

	describe("離脱メンバー表示", () => {
		it("showLeftMember=trueの場合、離脱したメンバーも表示される", async () => {
			const settingsWithLeftMember: CurrentSettings = {
				...settingsWithHistory,
				members: [1, 2, 3, 4, 5, 6, 7, 8], // 9, 10 は離脱
				gameCounts: {
					...settingsWithHistory.gameCounts,
					11: { playCount: 2, baseCount: 0 }, // 離脱メンバー
				},
			};

			render(<MemberCountPane settings={settingsWithLeftMember} showLeftMember={true} />);

			// 離脱メンバーも表示される
			await waitFor(() => expect(screen.getByText("11 :")).toBeInTheDocument());
		});
	});
});
