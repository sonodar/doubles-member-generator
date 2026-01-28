import { Button, Center, CloseButton, Dialog, Heading, Spacer, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { useState } from "react";
import { IoDiceOutline } from "react-icons/io5";
import { MdCheck, MdHistory } from "react-icons/md";
import { type CurrentSettings, generate, isConsecutiveOperation, retry } from "../../logic";
import ConfirmDialog from "../common/ConfirmDialog";
import { StatisticsPane } from "./StatisticsPane.tsx";

type Props = {
	settings: CurrentSettings;
	onGenerate: (settings: CurrentSettings) => void;
	disabled?: boolean;
};

export function GenerateButton({ settings, onGenerate, disabled }: Props) {
	const { open, onOpen, onClose } = useDisclosure();
	const [showWarning, setShowWarning] = useState(false);
	const [newSettings, setNewSettings] = useState<CurrentSettings | undefined>();

	const handleClick = () => {
		if (isConsecutiveOperation(settings.histories)) {
			setShowWarning(true);
		} else {
			setNewSettings(generate(settings));
			onOpen();
		}
	};

	const handleWarningCancel = () => {
		setShowWarning(false);
	};

	const handleWarningContinue = () => {
		setShowWarning(false);
		setNewSettings(generate(settings));
		onOpen();
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

			<ConfirmDialog
				open={showWarning}
				onCancel={handleWarningCancel}
				onOk={handleWarningContinue}
				title="ちょっと待ってください"
				cancelButtonText="やめる"
				okButtonText="このまま続ける"
				okColorPalette="danger"
			>
				<Stack gap={3}>
					<Text>
						さっき決めたばかりですが、もう一度メンバーを決め直しますか？
						このまま続けると、同じ人ばかり試合に出たり、出番が偏ったりする原因になります。
					</Text>
					<Text>
						すでに確定した前回の結果は変更できませんが、確定する前に組み合わせを変えるなら「やり直し」ボタンを使ってください。
					</Text>
				</Stack>
			</ConfirmDialog>

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
