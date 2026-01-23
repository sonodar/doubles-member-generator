import { IconButton, useDisclosure } from "@chakra-ui/react";
import { Fragment, useMemo, useState } from "react";
import { GoShare } from "react-icons/go";
import ConfirmDialog from "../common/ConfirmDialog.tsx";
import { toaster } from "../theme.ts";
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
	const [loading, setLoading] = useState(false);

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
		setLoading(true);
		try {
			await onIssue();
			onIssueClose();
			toaster.create({
				title: "共有リンクを発行しました",
				type: "success",
				duration: 2000,
			});
			onShareOpen();
		} catch {
			toaster.create({
				title: "共有リンクの発行に失敗しました",
				type: "error",
				duration: 3000,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<Fragment>
			<IconButton variant={"ghost"} aria-label="シェア" onClick={handleClick} disabled={disabled}>
				<GoShare />
			</IconButton>
			<ConfirmDialog
				open={isIssueOpen}
				onCancel={onIssueClose}
				onOk={handleOk}
				title={"共有リンクの発行"}
				loading={loading}
			>
				共有リンクを発行すると、現在の状態を他の人とリアルタイムで共有できます。共有リンクを発行しますか？
			</ConfirmDialog>
			<ShareDialog value={shareLink} open={isShareOpen} onClose={onShareClose} />
		</Fragment>
	);
}
