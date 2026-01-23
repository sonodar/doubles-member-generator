import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../testing/utils";
import { MemberButton } from "./MemberButton";
import { settingsAtom } from "../state";
import { Algorithms, type CurrentSettings, type CourtMembers } from "@logic";

describe("MemberButton", () => {
	const courtMembers: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];

	const settingsWithHistory: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8],
		histories: [
			{
				members: courtMembers,
				time: "2026-01-21T10:00:00+09:00",
			},
		],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	const settingsWithoutHistory: CurrentSettings = {
		courtCount: 2,
		members: [1, 2, 3, 4, 5, 6, 7, 8],
		histories: [],
		gameCounts: {},
		algorithm: Algorithms.DISCRETENESS,
	};

	describe("基本表示", () => {
		it("メンバーボタンが表示される", () => {
			render(<MemberButton />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			expect(screen.getByRole("button", { name: "メンバー" })).toBeInTheDocument();
		});
	});

	describe("無効状態", () => {
		it("履歴がない場合、ボタンが無効になる", () => {
			render(<MemberButton />, {
				initialAtomValues: [[settingsAtom, settingsWithoutHistory]],
			});

			expect(screen.getByRole("button", { name: "メンバー" })).toBeDisabled();
		});

		it("isDisabled=trueの場合、ボタンが無効になる", () => {
			render(<MemberButton disabled={true} />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			expect(screen.getByRole("button", { name: "メンバー" })).toBeDisabled();
		});
	});

	describe("ダイアログ表示", () => {
		it("クリック時にメンバーダイアログが表示される", async () => {
			render(<MemberButton />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			fireEvent.click(screen.getByRole("button", { name: "メンバー" }));

			await waitFor(() => {
				expect(screen.getByText("プレイ回数・休憩回数")).toBeInTheDocument();
			});
		});
	});
});
