import { IconButton, useDisclosure } from "@chakra-ui/react";
import { HistoryDialog } from "@components/common/HistoryDialog.tsx";
import { useSettings } from "@components/state";
import { Fragment } from "react";
import { MdOutlineWatchLater } from "react-icons/md";

export function HistoryButton({ disabled }: { disabled?: boolean }) {
	const { histories } = useSettings();
	const { open, onOpen, onClose } = useDisclosure();
	return (
		<Fragment>
			<IconButton variant={"ghost"} aria-label="履歴" disabled={disabled || histories.length === 0} onClick={onOpen}>
				<MdOutlineWatchLater />
			</IconButton>
			<HistoryDialog open={open} onClose={onClose} />
		</Fragment>
	);
}
