import { Button, Stack, Center, useDisclosure } from "@chakra-ui/react";
import { type ComponentProps } from "react";
import { TbUsers } from "react-icons/tb";
import { COURT_CAPACITY } from "@logic";
import { type CurrentSettings } from "@logic";
import HistoryPane from "@components/common/HistoryPane.tsx";
import { AdjustmentDialog } from "@components/game/adjustment/AdjustmentDialog.tsx";

type AdjustedHandler = ComponentProps<typeof AdjustmentDialog>["onChange"];

type Props = {
	settings: CurrentSettings;
	onAdjusted: AdjustedHandler;
};

export function StatisticsPane({ settings, onAdjusted }: Props) {
	const histories = settings.histories.slice(settings.histories.length - 2);
	const showStatistics = settings.members.length > settings.courtCount * COURT_CAPACITY;
	const { onOpen, onClose, open } = useDisclosure();

	const handleChange: AdjustedHandler = (settings) => {
		onAdjusted(settings);
		onClose();
	};

	return (
		<Stack gap={3}>
			<HistoryPane histories={histories} />
			{showStatistics && (
				<Center mt={4}>
					<Button w={"80%"} size={"sm"} variant={"outline"} color={"gray.600"} onClick={onOpen}>
						<TbUsers />
						プレイ回数を確認する
					</Button>
					<AdjustmentDialog settings={settings} open={open} onClose={onClose} onChange={handleChange} />
				</Center>
			)}
		</Stack>
	);
}
