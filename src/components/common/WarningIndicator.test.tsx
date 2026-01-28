import { describe, expect, it } from "vitest";
import type { WarningState } from "../../logic";
import { render, screen } from "../../testing/utils";
import WarningIndicator from "./WarningIndicator";

const createWarningState = (warnings: WarningState["warnings"] = []): WarningState => ({
	thresholds: { consecutiveRestThreshold: 2, playCountDiffThreshold: 2 },
	warnings,
	hasWarnings: warnings.length > 0,
});

describe("WarningIndicator", () => {
	describe("警告がない場合", () => {
		it("警告がない場合は何も表示しない", () => {
			const warningState = createWarningState();
			const { container } = render(<WarningIndicator memberId={1} warningState={warningState} />);
			expect(container.firstChild).toBeNull();
		});

		it("別のメンバーに警告がある場合は何も表示しない", () => {
			const warningState = createWarningState([{ memberId: 2, type: "consecutiveRest", value: 2, threshold: 2 }]);
			const { container } = render(<WarningIndicator memberId={1} warningState={warningState} />);
			expect(container.firstChild).toBeNull();
		});
	});

	describe("連続休憩警告", () => {
		it("連続休憩警告がある場合、警告アイコンを表示する", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);
			render(<WarningIndicator memberId={1} warningState={warningState} />);

			const icon = screen.getByTestId("warning-indicator");
			expect(icon).toBeInTheDocument();
		});

		it("連続休憩警告のツールチップに詳細が表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 3, threshold: 2 }]);
			render(<WarningIndicator memberId={1} warningState={warningState} />);

			const icon = screen.getByTestId("warning-indicator");
			expect(icon).toHaveAttribute("aria-label");
			expect(icon.getAttribute("aria-label")).toContain("連続休憩");
		});
	});

	describe("試合回数差警告", () => {
		it("試合回数差警告がある場合、警告アイコンを表示する", () => {
			const warningState = createWarningState([{ memberId: 1, type: "playCountDiff", value: 0, threshold: 2 }]);
			render(<WarningIndicator memberId={1} warningState={warningState} />);

			const icon = screen.getByTestId("warning-indicator");
			expect(icon).toBeInTheDocument();
		});

		it("試合回数差警告のツールチップに詳細が表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "playCountDiff", value: 1, threshold: 2 }]);
			render(<WarningIndicator memberId={1} warningState={warningState} />);

			const icon = screen.getByTestId("warning-indicator");
			expect(icon).toHaveAttribute("aria-label");
			expect(icon.getAttribute("aria-label")).toContain("試合回数");
		});
	});

	describe("複数の警告", () => {
		it("複数の警告がある場合、すべての警告情報がツールチップに含まれる", () => {
			const warningState = createWarningState([
				{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 },
				{ memberId: 1, type: "playCountDiff", value: 0, threshold: 2 },
			]);
			render(<WarningIndicator memberId={1} warningState={warningState} />);

			const icon = screen.getByTestId("warning-indicator");
			const ariaLabel = icon.getAttribute("aria-label") ?? "";
			expect(ariaLabel).toContain("連続休憩");
			expect(ariaLabel).toContain("試合回数");
		});
	});

	describe("サイズオプション", () => {
		it("size=smでアイコンが小さく表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);
			render(<WarningIndicator memberId={1} warningState={warningState} size="sm" />);

			const icon = screen.getByTestId("warning-indicator");
			expect(icon).toBeInTheDocument();
		});

		it("size=mdでアイコンが標準サイズで表示される", () => {
			const warningState = createWarningState([{ memberId: 1, type: "consecutiveRest", value: 2, threshold: 2 }]);
			render(<WarningIndicator memberId={1} warningState={warningState} size="md" />);

			const icon = screen.getByTestId("warning-indicator");
			expect(icon).toBeInTheDocument();
		});
	});
});
