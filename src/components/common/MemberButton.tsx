import { IconButton, useDisclosure } from "@chakra-ui/react";
import { Fragment } from "react";
import { TbUsers } from "react-icons/tb";
import { MemberDialog } from "@components/common/MemberDialog.tsx";
import { useSettings } from "@components/state";

export function MemberButton({ disabled }: { disabled?: boolean }) {
	const { histories } = useSettings();
	const { open, onOpen, onClose } = useDisclosure();
	return (
		<Fragment>
			<IconButton
				variant={"ghost"}
				colorPalette={"brand"}
				fontSize={"2xl"}
				aria-label="メンバー"
				disabled={disabled || histories.length === 0}
				onClick={onOpen}
			>
				<TbUsers />
			</IconButton>
			<MemberDialog open={open} onClose={onClose} showLeftMember={true} />
		</Fragment>
	);
}
