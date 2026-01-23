import { Card, Center, Heading, HStack, Separator, SimpleGrid, Stack } from "@chakra-ui/react";
import type { CourtMembers, GameMembers } from "../../logic";
import { array } from "../../logic";

type ParentProps = {
	members: GameMembers;
	single?: boolean;
	archive?: boolean;
	highlight?: boolean;
};

export default function CourtMembersPane({ members, single = false, archive = false, highlight = false }: ParentProps) {
	const courtIds = array.generate(members.length, 0);
	return (
		<SimpleGrid columns={2} gap={4} justifyItems={"center"}>
			{members.length > 0 &&
				courtIds.map((id) => (
					<CourtCard key={id} id={id} members={members[id]} single={single} archive={archive} highlight={highlight} />
				))}
		</SimpleGrid>
	);
}

type ChildProps = {
	id: number;
	members: CourtMembers;
	single: boolean;
	archive?: boolean;
	highlight?: boolean;
};

function CourtCard({ id, members, archive, highlight }: ChildProps) {
	const headColor = archive ? "gray.500" : highlight ? "gray.100" : "gray.600";
	const color = archive ? "gray.500" : highlight ? "gray.100" : "primary.900";

	return (
		<Card.Root p={2} w="100%" bg={highlight ? "primary.300" : undefined}>
			<Stack w={"100%"}>
				<Center>
					<Heading as={"label"} size={"sm"} color={headColor}>{`コート${id + 1}`}</Heading>
				</Center>
				<Separator />
				<HStack w="100%" justify="space-evenly" color={color}>
					{members.map((member) => (
						<strong key={member}>{member}</strong>
					))}
				</HStack>
			</Stack>
		</Card.Root>
	);
}
