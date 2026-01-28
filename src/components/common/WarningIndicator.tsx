import { Box, type SystemStyleObject } from "@chakra-ui/react";
import { IoWarning } from "react-icons/io5";
import type { WarningState, WarningType } from "../../logic";

type WarningIndicatorProps = {
	/** メンバーID */
	memberId: number;
	/** 警告状態（外部から渡す場合） */
	warningState: WarningState;
	/** サイズ */
	size?: "sm" | "md";
};

const warningTypeLabels: Record<WarningType, string> = {
	consecutiveRest: "連続休憩",
	playCountDiff: "試合回数が少ない",
};

function formatWarningLabel(warnings: WarningState["warnings"]): string {
	return warnings
		.map((w) => {
			const label = warningTypeLabels[w.type];
			if (w.type === "consecutiveRest") {
				return `${label}: ${w.value}回`;
			}
			return `${label}: ${w.value}回（差: ${w.threshold}以上）`;
		})
		.join(", ");
}

const sizeStyles: Record<"sm" | "md", SystemStyleObject> = {
	sm: { fontSize: "sm" },
	md: { fontSize: "md" },
};

/**
 * 警告アイコンを表示
 * - 警告がある場合: ⚠️ アイコン（オレンジ）
 * - 警告がない場合: 何も表示しない
 */
export default function WarningIndicator({ memberId, warningState, size = "md" }: WarningIndicatorProps) {
	const memberWarnings = warningState.warnings.filter((w) => w.memberId === memberId);

	if (memberWarnings.length === 0) {
		return null;
	}

	const ariaLabel = formatWarningLabel(memberWarnings);

	return (
		<Box
			as="span"
			display="inline-flex"
			alignItems="center"
			color="orange.500"
			data-testid="warning-indicator"
			aria-label={ariaLabel}
			title={ariaLabel}
			css={sizeStyles[size]}
		>
			<IoWarning />
		</Box>
	);
}
