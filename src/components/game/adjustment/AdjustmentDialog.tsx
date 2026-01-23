import { Button, Center, CloseButton, Dialog, Heading, Spacer, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { MdOutlineCancel } from "react-icons/md";
import { IoMdDownload } from "react-icons/io";
import { type CurrentSettings, type GameMembers, replace } from "@logic";
import { AdjustmentPane } from "@components/game/adjustment/AdjustmentPane.tsx";
import MemberCountPane from "@components/common/MemberCountPane.tsx";

type Props = {
	settings: CurrentSettings;
	open: boolean;
	onClose: () => void;
	onChange: (settings: CurrentSettings) => void;
};

export function AdjustmentDialog({ settings, open, onClose, onChange }: Props) {
	const [newSettings, setNewSettings] = useState(settings);

	const handleAdjust = (gameMembers: GameMembers) => {
		const settings = replace(newSettings, gameMembers);
		setNewSettings(settings);
	};

	const handleOk = () => {
		onChange(newSettings);
		onClose();
	};

	const handleCancel = () => {
		setNewSettings(settings);
		onClose();
	};

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(e) => !e.open && handleCancel()}
			scrollBehavior={"inside"}
			placement="center"
			motionPreset={"slide-in-bottom"}
		>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content w="100%" maxW="480px" maxH={"100dvh"}>
					<Dialog.Header>
						<Stack gap={3}>
							<Heading as={"h3"} size={"md"}>
								プレイ回数
							</Heading>
						</Stack>
					</Dialog.Header>
					<Dialog.CloseTrigger asChild>
						<CloseButton size="sm" />
					</Dialog.CloseTrigger>
					<Dialog.Body pt={0} px={2} mt={-2}>
						<Stack gap={4}>
							<MemberCountPane settings={newSettings} />
							<Center>
								<AdjustmentPane {...newSettings} onChange={handleAdjust} />
							</Center>
						</Stack>
					</Dialog.Body>
					<Dialog.Footer>
						<Button w={"45%"} colorPalette={"brand"} onClick={handleOk} size={"sm"} rounded={"full"}>
							<IoMdDownload />
							調整反映
						</Button>
						<Spacer />
						<Button w={"45%"} variant={"outline"} onClick={handleCancel} size={"sm"} rounded={"full"}>
							<MdOutlineCancel />
							キャンセル
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
