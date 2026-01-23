import { CloseButton, Dialog, Heading } from "@chakra-ui/react";
import MemberCountPane from "./MemberCountPane.tsx";
import { type CurrentSettings } from "@logic";

type Props = {
	settings?: CurrentSettings;
	defaultTabIndex?: number;
	open: boolean;
	onClose: () => void;
	showLeftMember?: boolean;
};

export function MemberDialog({ settings, defaultTabIndex, open, onClose, showLeftMember }: Props) {
	return (
		<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="center">
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content maxW={"350px"}>
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
