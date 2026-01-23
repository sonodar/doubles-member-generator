import { Box, Flex, Heading, Separator, Spacer, Stack, Text } from "@chakra-ui/react";
import { format } from "@formkit/tempo";
import type { History } from "../../logic";
import CourtMembersPane from "../game/CourtMembersPane.tsx";
import { useSettings } from "../state";

function formatDate(date: string) {
	return format(new Date(date), "YYYY/MM/DD HH:mm");
}

export default function HistoryPane(props: { histories?: History[] }) {
	const settingsHistories = useSettings().histories;
	const rawHistories = props.histories || settingsHistories;

	const [current, previous, ...olds] = rawHistories.map((history, index) => ({ index, history })).reverse();

	const CurrentHistoryPane = ({ members, time }: History) => (
		<Box key={members.flat().join(",")} px={2} py={3} borderRadius="md" borderWidth="3px" borderColor="orange.500">
			<Flex p={2}>
				<Heading as={"label"} size={"md"} color={"primary.900"} fontWeight="bold">
					{" 今回 "}
				</Heading>
				<Spacer />
				<Text fontSize={"xs"} color="gray.600" fontWeight="medium">
					{formatDate(time)}
				</Text>
			</Flex>
			<CourtMembersPane members={members} single={false} />
			<Text fontSize={"xs"} p={2} color="red.600" fontWeight="medium">
				ペアは各コートでじゃんけんなどで決めてください
			</Text>
		</Box>
	);

	const PreviousHistoryPane = ({ members, time }: History) => (
		<Box key={members.flat().join(",")} px={2}>
			<Flex p={2}>
				<Heading as={"label"} size={"sm"} color={"gray.500"}>
					{" 前回 "}
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
		<Stack gap={3} separator={<Separator />} w={"100%"}>
			{current && <CurrentHistoryPane {...current.history} />}
			{previous && <PreviousHistoryPane {...previous.history} />}
			{olds &&
				olds.length > 0 &&
				olds.map(({ history, index }) => <OlderHistoryPane key={index} {...history} index={index} />)}
		</Stack>
	);
}
