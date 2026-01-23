import { Box, Flex, Heading, Spacer, Stack, Text } from "@chakra-ui/react";
import { format } from "@formkit/tempo";
import type { History } from "../../logic";
import CourtMembersPane from "../game/CourtMembersPane.tsx";
import { useSettings } from "../state";

function formatDate(date: string) {
	return format(new Date(date), "YYYY/MM/DD HH:mm");
}

export default function HistoryPane(props: { histories?: History[]; showPairMessage?: boolean; offset?: number }) {
	const settingsHistories = useSettings().histories;
	const rawHistories = props.histories || settingsHistories;
	const showPairMessage = props.showPairMessage ?? true;
	const offset = props.offset ?? 0;

	const [current, previous, ...olds] = rawHistories
		.map((history, index) => ({ index: index + offset, history }))
		.reverse();

	const CurrentHistoryPane = ({ members, time, index }: History & { index: number }) => (
		<Box key={members.flat().join(",")} px={4} py={4} borderWidth={1} borderColor="primary.100" borderRadius="md">
			<Flex px={2} pb={2}>
				<Heading as={"label"} size={"sm"} color={"primary.300"}>
					{` 今回（${index + 1} 回目）`}
				</Heading>
				<Spacer />
				<Text fontSize={"xs"} color="gray.500">
					{formatDate(time)}
				</Text>
			</Flex>
			<CourtMembersPane members={members} single={false} highlight={true} />
			{showPairMessage && (
				<Text fontSize={"xs"} p={2} pb={0} color="red.500">
					ペアは各コートでじゃんけんなどで決めてください
				</Text>
			)}
		</Box>
	);

	const PreviousHistoryPane = ({ members, time, index }: History & { index: number }) => (
		<Box key={members.flat().join(",")} px={2}>
			<Flex p={2}>
				<Heading as={"label"} size={"sm"} color={"gray.500"}>
					{` 前回（${index + 1} 回目）`}
				</Heading>
				<Spacer />
				<Text fontSize={"xs"} color="gray.500">
					{formatDate(time)}
				</Text>
			</Flex>
			<CourtMembersPane members={members} single={false} archive={true} />
		</Box>
	);

	const OlderHistoryPane = ({
		members,
		time,
		index,
	}: History & {
		index: number;
	}) => (
		<Box key={members.flat().join(",")} px={2}>
			<Flex p={2}>
				<Heading as={"label"} size={"sm"} color={"gray.500"}>
					{`${index + 1} 回目`}
				</Heading>
				<Spacer />
				<Text fontSize={"xs"} color="gray.500">
					{formatDate(time)}
				</Text>
			</Flex>
			<CourtMembersPane members={members} single={false} archive={true} />
		</Box>
	);

	return (
		<Stack gap={3} w={"100%"}>
			{current && <CurrentHistoryPane {...current.history} index={current.index} />}
			{previous && <PreviousHistoryPane {...previous.history} index={previous.index} />}
			{olds &&
				olds.length > 0 &&
				olds.map(({ history, index }) => <OlderHistoryPane key={index} {...history} index={index} />)}
		</Stack>
	);
}
