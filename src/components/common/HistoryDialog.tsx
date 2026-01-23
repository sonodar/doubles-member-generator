import { Center, CloseButton, Dialog } from "@chakra-ui/react";
import HistoryPane from "./HistoryPane.tsx";
import { prettyFont } from "@components/theme.ts";

type Props = {
	open: boolean;
	onClose: () => void;
};

export function HistoryDialog({ open, onClose }: Props) {
	return (
		<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} scrollBehavior={"inside"} size={"full"}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content w="100%" maxW="480px">
					<Dialog.Header maxH={"xs"} style={{ ...prettyFont }}>
						履歴
					</Dialog.Header>
					<Dialog.CloseTrigger asChild>
						<CloseButton size="sm" />
					</Dialog.CloseTrigger>
					<Dialog.Body p={4}>
						<Center>
							<HistoryPane />
						</Center>
					</Dialog.Body>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
