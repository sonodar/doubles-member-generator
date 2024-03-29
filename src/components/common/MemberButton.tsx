import { IconButton, useDisclosure } from "@chakra-ui/react";
import { Fragment } from "react";
import { TbUsers } from "react-icons/tb";
import { MemberDialog } from "@components/common/MemberDialog.tsx";
import { useSettings } from "@components/state";

export function MemberButton({ isDisabled }: { isDisabled?: boolean }) {
	const { histories } = useSettings();
	const { isOpen, onOpen, onClose } = useDisclosure();
	return (
		<Fragment>
			<IconButton
				variant={"ghost"}
				colorScheme={"brand"}
				fontSize={"2xl"}
				aria-label="メンバー"
				icon={<TbUsers />}
				isDisabled={isDisabled || histories.length === 0}
				onClick={onOpen}
			/>
			<MemberDialog isOpen={isOpen} onClose={onClose} showLeftMember={true} />
		</Fragment>
	);
}
