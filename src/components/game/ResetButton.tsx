import { IconButton, useDisclosure } from "@chakra-ui/react";
import { Fragment } from "react";
import { MdClose } from "react-icons/md";
import ConfirmDialog from "../common/ConfirmDialog.tsx";

export function ResetButton({ disabled, onReset }: { disabled?: boolean; onReset: () => void }) {
	const { open, onOpen, onClose } = useDisclosure();
	return (
		<Fragment>
			<IconButton
				colorPalette={"danger"}
				size={"sm"}
				mt={1}
				fontSize={"lg"}
				aria-label="メンバー"
				onClick={onOpen}
				disabled={disabled}
			>
				<MdClose />
			</IconButton>
			<ConfirmDialog
				open={open}
				onCancel={onClose}
				onOk={() => {
					onClose();
					onReset();
				}}
				okColorPalette={"danger"}
				title={"本当に終了しますか？"}
			>
				プレイ履歴をリセットして初期設定に戻ります。今回の設定は次回に引き継がれます。
			</ConfirmDialog>
		</Fragment>
	);
}
