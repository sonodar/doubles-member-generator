import { Box, Card, Center, HStack, Separator, Stack } from "@chakra-ui/react";
import { useAtom } from "jotai";
import { useState } from "react";
import { createEnvironment, EventType, eventEmitter, finishEnvironment } from "../../api";
import { type CurrentSettings, getLatestMembers } from "../../logic";
import { AlgorithmBadge } from "../common/AlgorithmBadge";
import { HistoryButton } from "../common/HistoryButton.tsx";
import { MemberButton } from "../common/MemberButton.tsx";
import { shareIdAtom, useSettingsReducer } from "../state";
import { toaster } from "../theme.ts";
import CourtMembersPane from "./CourtMembersPane";
import { CurrentMemberCountInput } from "./CurrentMemberCountInput";
import { GenerateButton } from "./GenerateButton.tsx";
import { ResetButton } from "./ResetButton";
import { ShareButton } from "./ShareButton";

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
		try {
			const { id } = await createEnvironment();
			setEnvironmentId(id);
			await eventEmitter(id).initialize(settings);
		} finally {
			closeProgress();
		}
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
		<Card.Root w={"100%"} height={"100dvh"} borderWidth={0} boxShadow={"none"}>
			<Card.Body px={4} py={2}>
				<Center>
					<Stack gap={2} w={"100%"}>
						<CurrentMemberCountInput onIncrement={handleJoin} onDecrement={handleLeave} disabled={progress} />
						<Center>
							<AlgorithmBadge algorithm={settings.algorithm} />
						</Center>
						<GenerateButton settings={settings} onGenerate={handleGenerate} disabled={progress} />
						{latestMembers.length > 0 && (
							<Box pt={4}>
								<CourtMembersPane members={latestMembers} />
							</Box>
						)}
					</Stack>
				</Center>
			</Card.Body>
			<Separator color={"gray.300"} />
			<Card.Footer px={4} py={2} pb="max(12px, env(safe-area-inset-bottom))">
				<HStack w="100%" justify="space-evenly">
					<HistoryButton disabled={progress} />
					<MemberButton disabled={progress} />
					<ShareButton sharedId={environmentId} onIssue={issueShareLink} disabled={progress} />
					<ResetButton onReset={clear} disabled={progress} />
				</HStack>
			</Card.Footer>
		</Card.Root>
	);
}
