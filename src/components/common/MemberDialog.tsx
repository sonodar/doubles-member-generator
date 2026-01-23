import { CloseButton, Dialog, Heading } from "@chakra-ui/react";
import type { CurrentSettings } from "@logic";
import MemberCountPane from "./MemberCountPane.tsx";

type Props = {
	settings?: CurrentSettings;
	defaultTabIndex?: number;
	open: boolean;
	onClose: () => void;
	showLeftMember?: boolean;
};

export function MemberDialog({ settings, defaultTabIndex, open, onClose, showLeftMember }: Props) {
	return (
		<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size={"full"}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content w="100%" maxW="480px">
					<Dialog.Header>
						<Heading as={"label"} size={"sm"}>
							プレイ回数・休憩回数
						</Heading>
					</Dialog.Header>
					<Dialog.CloseTrigger asChild>
						<CloseButton size="sm" />
					</Dialog.CloseTrigger>
					<Dialog.Body pt={0} px={2} mt={-2}>
						<MemberCountPane settings={settings} showLeftMember={showLeftMember} defaultTabIndex={defaultTabIndex} />
					</Dialog.Body>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
