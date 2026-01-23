import type { CourtMembers, History } from "@logic";
import { describe, expect, it } from "vitest";
import { render, screen } from "../../testing/utils";
import HistoryPane from "./HistoryPane";

describe("HistoryPane", () => {
	const courtMembers1: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];
	const courtMembers2: CourtMembers[] = [
		[2, 3, 4, 5],
		[6, 7, 8, 1],
	];
	const courtMembers3: CourtMembers[] = [
		[3, 4, 5, 6],
		[7, 8, 1, 2],
	];

	const histories: History[] = [
		{ members: courtMembers1, time: "2026-01-21T10:00:00+09:00" },
		{ members: courtMembers2, time: "2026-01-21T10:30:00+09:00" },
		{ members: courtMembers3, time: "2026-01-21T11:00:00+09:00" },
	];

	describe("基本表示", () => {
		it("履歴がある場合、「今回」「前回」などのラベルが表示される", () => {
			render(<HistoryPane histories={histories} />);

			expect(screen.getByText("今回")).toBeInTheDocument();
			expect(screen.getByText("前回")).toBeInTheDocument();
		});

		it("履歴の日時が表示される", () => {
			render(<HistoryPane histories={histories} />);

			// 日時がフォーマットされて表示される
			expect(screen.getByText("2026/01/21 11:00")).toBeInTheDocument();
			expect(screen.getByText("2026/01/21 10:30")).toBeInTheDocument();
		});

		it("コート情報が表示される", () => {
			render(<HistoryPane histories={histories} />);

			// コート1, コート2 のラベルが表示される
			const court1Labels = screen.getAllByText("コート1");
			expect(court1Labels.length).toBeGreaterThan(0);
		});
	});

	describe("履歴が空の場合", () => {
		it("履歴が空の場合は何も表示されない", () => {
			render(<HistoryPane histories={[]} />);

			// 今回/前回のラベルがない
			expect(screen.queryByText("今回")).not.toBeInTheDocument();
			expect(screen.queryByText("前回")).not.toBeInTheDocument();
		});
	});

	describe("履歴が1件の場合", () => {
		it("「今回」のみ表示される", () => {
			render(<HistoryPane histories={[histories[0]]} />);

			expect(screen.getByText("今回")).toBeInTheDocument();
			expect(screen.queryByText("前回")).not.toBeInTheDocument();
		});
	});
});
