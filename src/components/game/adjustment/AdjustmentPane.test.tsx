import type { CourtMembers, History } from "@logic";
import * as swapModule from "@logic";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../testing/utils";
import { AdjustmentPane } from "./AdjustmentPane";

// swapGameMemberをモック
vi.mock("@logic", async () => {
	const actual = await vi.importActual<typeof import("@logic")>("@logic");
	return {
		...actual,
		swapGameMember: vi.fn(actual.swapGameMember),
	};
});

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
		vi.mocked(swapModule.swapGameMember).mockClear();
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

		it("休憩メンバーがいない場合、休憩エリアは表示されない", () => {
			const exactMembers = [1, 2, 3, 4, 5, 6, 7, 8];
			render(
				<AdjustmentPane courtCount={courtCount} members={exactMembers} histories={histories} onChange={mockOnChange} />,
			);

			// コートメンバーは表示される
			expect(screen.getByText("コート 1")).toBeInTheDocument();
			// 休憩見出しは表示されない（休憩メンバーなし）
			expect(screen.queryByText("休憩")).not.toBeInTheDocument();
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

	describe("ドラッグ&ドロップ操作", () => {
		it("履歴が最新の履歴に基づくメンバー配置を表示する", () => {
			const multipleHistories: History[] = [
				{
					members: [
						[10, 9, 8, 7],
						[6, 5, 4, 3],
					],
					time: "2026-01-21T00:00:00+09:00",
				},
				{
					members: courtMembers,
					time: "2026-01-21T01:00:00+09:00",
				},
			];

			render(
				<AdjustmentPane
					courtCount={courtCount}
					members={members}
					histories={multipleHistories}
					onChange={mockOnChange}
				/>,
			);

			// 最新履歴のメンバーが表示される（courtMembers: [1,2,3,4], [5,6,7,8]）
			expect(screen.getByText("1")).toBeInTheDocument();
			expect(screen.getByText("5")).toBeInTheDocument();
		});
	});
});
