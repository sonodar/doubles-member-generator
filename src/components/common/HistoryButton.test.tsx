import { describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../testing/utils";
import { HistoryButton } from "./HistoryButton";
import { settingsAtom } from "../state";
import { Algorithms, type CurrentSettings, type CourtMembers } from "@logic";

describe("HistoryButton", () => {
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
		it("履歴ボタンが表示される", () => {
			render(<HistoryButton />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			expect(screen.getByRole("button", { name: "履歴" })).toBeInTheDocument();
		});
	});

	describe("無効状態", () => {
		it("履歴がない場合、ボタンが無効になる", () => {
			render(<HistoryButton />, {
				initialAtomValues: [[settingsAtom, settingsWithoutHistory]],
			});

			expect(screen.getByRole("button", { name: "履歴" })).toBeDisabled();
		});

		it("isDisabled=trueの場合、ボタンが無効になる", () => {
			render(<HistoryButton disabled={true} />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			expect(screen.getByRole("button", { name: "履歴" })).toBeDisabled();
		});
	});

	describe("ダイアログ表示", () => {
		it("クリック時に履歴ダイアログが表示される", async () => {
			render(<HistoryButton />, {
				initialAtomValues: [[settingsAtom, settingsWithHistory]],
			});

			fireEvent.click(screen.getByRole("button", { name: "履歴" }));

			await waitFor(() => {
				expect(screen.getByText("履歴")).toBeInTheDocument();
			});
		});
	});
});
