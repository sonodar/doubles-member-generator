import { List } from "@chakra-ui/react";
import type { MemberWarning, WarningState, WarningType } from "../../logic";
import ConfirmDialog from "./ConfirmDialog";

type WarningConfirmDialogProps = {
	/** 警告状態 */
	warningState: WarningState;
	/** ダイアログの開閉状態 */
	open: boolean;
	/** 「調整する」選択時のコールバック */
	onAdjust: () => void;
	/** 「このまま確定」選択時のコールバック */
	onConfirm: () => void;
};

const warningTypeLabels: Record<WarningType, string> = {
	consecutiveRest: "連続休憩",
	playCountDiff: "試合回数が少ない",
};

function formatWarningMessage(warning: MemberWarning): string {
	const label = warningTypeLabels[warning.type];
	if (warning.type === "consecutiveRest") {
		return `メンバー${warning.memberId}: ${label}が${warning.value}回続いています`;
	}
	return `メンバー${warning.memberId}: ${label}（${warning.value}回）`;
}

/**
 * 警告確認ダイアログ
 * - タイトル: 「偏りがあります」
 * - 本文: 警告内容を箇条書きで表示
 * - ボタン: 「調整する」「このまま確定」
 */
export default function WarningConfirmDialog({ warningState, open, onAdjust, onConfirm }: WarningConfirmDialogProps) {
	return (
		<ConfirmDialog
			open={open}
			onCancel={onAdjust}
			onOk={onConfirm}
			title="偏りがあります"
			cancelButtonText="調整する"
			okButtonText="このまま確定"
			okColorPalette="orange"
		>
			<List.Root as="ul" ps={4}>
				{warningState.warnings.map((warning, index) => (
					<List.Item key={`${warning.memberId}-${warning.type}-${index}`}>{formatWarningMessage(warning)}</List.Item>
				))}
			</List.Root>
		</ConfirmDialog>
	);
}
