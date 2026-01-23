import { Box, Card, Center, Separator, Spacer, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { toaster } from "@components/theme.ts";
import { useAtom } from "jotai";
import { ShareButton } from "./ShareButton";
import { EventType, createEnvironment, eventEmitter, finishEnvironment } from "@api";
import { getLatestMembers, type CurrentSettings } from "@logic";
import CourtMembersPane from "@components/game/CourtMembersPane";
import { CurrentMemberCountInput } from "@components/game/CurrentMemberCountInput";
import { HistoryButton } from "@components/common/HistoryButton.tsx";
import { MemberButton } from "@components/common/MemberButton.tsx";
import { ResetButton } from "@components/game/ResetButton";
import { useSettingsReducer, shareIdAtom } from "@components/state";
import { GenerateButton } from "@components/game/GenerateButton.tsx";
import { AlgorithmBadge } from "@components/common/AlgorithmBadge";

type Props = {
	onReset: () => void;
};

export default function GamePane({ onReset }: Props) {
	const [settings, dispatch] = useSettingsReducer();

	const [environmentId, setEnvironmentId] = useAtom(shareIdAtom);
	const [progress, setProgress] = useState(false);

	const latestMembers = getLatestMembers(settings) || [];

	const openProgress = () => setProgress(true);
	const closeProgress = () => setProgress(false);

	const issueShareLink = async () => {
		openProgress();
		const { id } = await createEnvironment();
		setEnvironmentId(id);
		await eventEmitter(id).initialize(settings);
		closeProgress();
	};

	const handleJoin = () => {
		dispatch({ type: EventType.Join });
		if (environmentId) {
			eventEmitter(environmentId).join();
		}
	};

	const handleGenerate = (newSettings: CurrentSettings) => {
		const members = getLatestMembers(newSettings)!;
		dispatch({ type: EventType.Generate, payload: { members } });
		if (environmentId) {
			eventEmitter(environmentId).generate(members);
		}
	};

	const handleIgnoreUsageAlert = () => dispatch("IGNORE_USAGE_ALERT");

	const handleLeave = (id: number) => {
		dispatch({ type: EventType.Leave, payload: { memberId: id } });
		if (environmentId) {
			eventEmitter(environmentId).leave(id);
		}
		toaster.create({
			title: `メンバー ${id} が離脱しました`,
			type: "warning",
			duration: 2000,
		});
	};

	const clear = () => {
		onReset();
		if (environmentId) {
			eventEmitter(environmentId).finish();
			finishEnvironment(environmentId);
		}
	};

	return (
		<Card.Root m={0} p={0} height={"100dvh"}>
			<Card.Body px={4} pt={2}>
				<Center>
					<Stack gap={2}>
						<CurrentMemberCountInput onIncrement={handleJoin} onDecrement={handleLeave} disabled={progress} />
						<Center>
							<AlgorithmBadge algorithm={settings.algorithm} />
						</Center>
						<GenerateButton
							settings={settings}
							onGenerate={handleGenerate}
							onIgnoreUsageAlert={handleIgnoreUsageAlert}
							disabled={progress}
						/>
						{latestMembers.length > 0 && (
							<Box pt={4}>
								<CourtMembersPane members={latestMembers} />
							</Box>
						)}
					</Stack>
				</Center>
			</Card.Body>
			<Separator color={"gray.300"} />
			<Card.Footer px={10} py={2}>
				<HistoryButton disabled={progress} />
				<Spacer />
				<MemberButton disabled={progress} />
				<Spacer />
				<ShareButton sharedId={environmentId} onIssue={issueShareLink} disabled={progress} />
				<Spacer />
				<ResetButton onReset={clear} disabled={progress} />
			</Card.Footer>
		</Card.Root>
	);
}
