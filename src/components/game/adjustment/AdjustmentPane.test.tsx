import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "../../../testing/utils";
import { AdjustmentPane } from "./AdjustmentPane";
import type { CourtMembers, History } from "@logic";

describe("AdjustmentPane", () => {
	const mockOnChange = vi.fn();

	const courtCount = 2;
	const members = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const courtMembers: CourtMembers[] = [
		[1, 2, 3, 4],
		[5, 6, 7, 8],
	];
	const histories: History[] = [
		{
			members: courtMembers,
			time: "2026-01-21T00:00:00+09:00",
		},
	];

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	describe("基本表示", () => {
		it("コート別のメンバーボックスが表示される", () => {
			render(
				<AdjustmentPane courtCount={courtCount} members={members} histories={histories} onChange={mockOnChange} />,
			);

			// コート1, コート2 が表示される
			expect(screen.getByText("コート 1")).toBeInTheDocument();
			expect(screen.getByText("コート 2")).toBeInTheDocument();
		});

		it("ドラッグ＆ドロップの説明が表示される", () => {
			render(
				<AdjustmentPane courtCount={courtCount} members={members} histories={histories} onChange={mockOnChange} />,
			);

			expect(screen.getByText(/ドラッグ＆ドロップで調整できます/)).toBeInTheDocument();
		});

		it("休憩メンバーがいる場合、休憩メンバーエリアが表示される", () => {
			render(
				<AdjustmentPane courtCount={courtCount} members={members} histories={histories} onChange={mockOnChange} />,
			);

			// 休憩メンバー（9, 10）が表示される
			expect(screen.getByText("9")).toBeInTheDocument();
			expect(screen.getByText("10")).toBeInTheDocument();
		});
	});

	describe("コートメンバーの表示", () => {
		it("各コートのメンバーIDが表示される", () => {
			render(
				<AdjustmentPane courtCount={courtCount} members={members} histories={histories} onChange={mockOnChange} />,
			);

			// コート1のメンバー
			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("2")).toBeInTheDocument();
			expect(screen.getByText("3")).toBeInTheDocument();
			expect(screen.getByText("4")).toBeInTheDocument();

			// コート2のメンバー
			expect(screen.getByText("5")).toBeInTheDocument();
			expect(screen.getByText("6")).toBeInTheDocument();
			expect(screen.getByText("7")).toBeInTheDocument();
			expect(screen.getByText("8")).toBeInTheDocument();
		});
	});

	describe("履歴がない場合", () => {
		it("履歴が空の場合はコート情報が表示されない", () => {
			render(<AdjustmentPane courtCount={courtCount} members={members} histories={[]} onChange={mockOnChange} />);

			// コート情報が表示されない
			expect(screen.queryByText("コート 1")).not.toBeInTheDocument();
			expect(screen.queryByText("コート 2")).not.toBeInTheDocument();
		});
	});
});
