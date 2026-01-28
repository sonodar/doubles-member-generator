import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WarningState } from "../../logic";
import { fireEvent, render, screen } from "../../testing/utils";
import WarningConfirmDialog from "./WarningConfirmDialog";

const createWarningState = (warnings: WarningState["warnings"] = []): WarningState => ({
	thresholds: { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 },
	warnings,
	hasWarnings: warnings.length > 0,
});

describe("WarningConfirmDialog", () => {
	const mockOnAdjust = vi.fn();
	const mockOnConfirm = vi.fn();

	beforeEach(() => {
		mockOnAdjust.mockClear();
		mockOnConfirm.mockClear();
	});

	describe("基本表示", () => {
		it("open=trueの場合、ダイアログが表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.getByText("偏りがあります")).toBeInTheDocument();
		});

		it("open=falseの場合、ダイアログが非表示", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={false}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.queryByText("偏りがあります")).not.toBeInTheDocument();
		});
	});

	describe("警告内容の表示", () => {
		it("連続休憩警告の内容が表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.getByText(/メンバー1/)).toBeInTheDocument();
			expect(screen.getByText(/連続休憩/)).toBeInTheDocument();
		});

		it("試合回数差警告の内容が表示される", () => {
			const warningState = createWarningState([{ memberId: 5, type: "playCountDiff", value: 0, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.getByText(/メンバー5/)).toBeInTheDocument();
			expect(screen.getByText(/試合回数/)).toBeInTheDocument();
		});

		it("複数の警告が箇条書きで表示される", () => {
			const warningState = createWarningState([
				{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 },
				{ memberId: 5, type: "playCountDiff", value: 0, threshold: 2 },
			]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.getByText(/メンバー1/)).toBeInTheDocument();
			expect(screen.getByText(/メンバー5/)).toBeInTheDocument();
		});
	});

	describe("ボタン操作", () => {
		it("「調整する」ボタンが表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.getByRole("button", { name: "調整する" })).toBeInTheDocument();
		});

		it("「このまま確定」ボタンが表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			expect(screen.getByRole("button", { name: "このまま確定" })).toBeInTheDocument();
		});

		it("「調整する」をクリックするとonAdjustが呼ばれる", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "調整する" }));
			expect(mockOnAdjust).toHaveBeenCalledTimes(1);
		});

		it("「このまま確定」をクリックするとonConfirmが呼ばれる", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);

			render(
				<WarningConfirmDialog
					open={true}
					warningState={warningState}
					onAdjust={mockOnAdjust}
					onConfirm={mockOnConfirm}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "このまま確定" }));
			expect(mockOnConfirm).toHaveBeenCalledTimes(1);
		});
	});
});
