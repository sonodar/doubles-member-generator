import { IconButton, useDisclosure } from "@chakra-ui/react";
import ConfirmDialog from "@components/common/ConfirmDialog.tsx";
import { toaster } from "@components/theme.ts";
import { Fragment, useMemo } from "react";
import { GoShare } from "react-icons/go";
import { ShareDialog } from "./ShareDialog";

type Props = {
	sharedId?: string;
	onIssue: () => Promise<void>;
	disabled?: boolean;
};

function makeShareLink(sharedId?: string) {
	if (!sharedId) return sharedId;
	return new URL(`/share/${sharedId}`, location.origin).toString();
}

export function ShareButton({ sharedId, onIssue, disabled }: Props) {
	const shareLink = useMemo(() => makeShareLink(sharedId), [sharedId]);

	const { open: isIssueOpen, onOpen: onIssueOpen, onClose: onIssueClose } = useDisclosure();
	const { open: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();

	const handleClick = () => {
		if (sharedId) {
			onShareOpen();
		} else {
			onIssueOpen();
		}
	};

	const handleOk = async () => {
		await onIssue();
		onIssueClose();
		toaster.create({
			title: "共有リンクを発行しました",
			type: "success",
			duration: 2000,
		});
		onShareOpen();
	};

	return (
		<Fragment>
			<IconButton variant={"ghost"} aria-label="シェア" onClick={handleClick} disabled={disabled}>
				<GoShare />
			</IconButton>
			<ConfirmDialog open={isIssueOpen} onCancel={onIssueClose} onOk={handleOk} title={"共有リンクの発行"}>
				共有リンクを発行すると、現在の状態を他の人とリアルタイムで共有できます。共有リンクを発行しますか？
			</ConfirmDialog>
			<ShareDialog value={shareLink} open={isShareOpen} onClose={onShareClose} />
		</Fragment>
	);
}
