import { Button, Center, CloseButton, Dialog, Heading, Spacer, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { IoDiceOutline } from "react-icons/io5";
import { MdCheck, MdHistory } from "react-icons/md";
import { UsageAlertDialog } from "./UsageAlertDialog";
import { type CurrentSettings } from "@logic";
import { generate, retry, isRecent } from "@logic";
import { StatisticsPane } from "@components/game/StatisticsPane.tsx";

type Props = {
	settings: CurrentSettings;
	onGenerate: (settings: CurrentSettings) => void;
	onIgnoreUsageAlert: () => void;
	disabled?: boolean;
};

export function GenerateButton({ settings, onGenerate, disabled, onIgnoreUsageAlert }: Props) {
	const { open, onOpen, onClose } = useDisclosure();
	const { open: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
	const [newSettings, setNewSettings] = useState<CurrentSettings | undefined>();

	const openGeneratePane = () => {
		setNewSettings(generate(settings));
		onOpen();
	};

	const handleClick = () => {
		if (settings.ignoreUsageAlert || !isRecent(settings)) {
			return openGeneratePane();
		}
		onAlertOpen();
	};

	const handleOk = () => {
		onGenerate(newSettings || settings);
		onClose();
	};

	const handleAdjust = (settings: CurrentSettings) => {
		setNewSettings(settings);
	};

	const handleRetry = () => {
		setNewSettings(retry(newSettings!));
		onOpen();
	};

	return (
		<Center>
			<Button w={"80%"} size={"xl"} colorPalette={"brand"} fontSize={"xl"} onClick={handleClick} disabled={disabled}>
				<IoDiceOutline />
				メンバー決め
			</Button>
			<UsageAlertDialog open={isAlertOpen} onClose={onAlertClose} onDismiss={onIgnoreUsageAlert} />
			<Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size={"full"}>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content maxW="480px">
						<Dialog.Header>
							<Stack gap={3} w={"100%"}>
								<Heading as={"h3"} size={"md"}>
									メンバー選出
								</Heading>
								<Text fontSize={"sm"}>以下の内容で確定します。よろしいですか？</Text>
							</Stack>
						</Dialog.Header>
						<Dialog.CloseTrigger asChild>
							<CloseButton size="sm" />
						</Dialog.CloseTrigger>
						<Dialog.Body p={0} mb={1}>
							<Center>
								<StatisticsPane settings={newSettings || settings} onAdjusted={handleAdjust} />
							</Center>
						</Dialog.Body>
						<Dialog.Footer>
							<Button w={"45%"} colorPalette={"primary"} onClick={handleOk}>
								<MdCheck />
								確定
							</Button>
							<Spacer />
							<Button
								w={"45%"}
								colorPalette={"brand"}
								variant={"outline"}
								onClick={handleRetry}
								disabled={!newSettings}
							>
								<MdHistory />
								やり直し
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Dialog.Root>
		</Center>
	);
}
