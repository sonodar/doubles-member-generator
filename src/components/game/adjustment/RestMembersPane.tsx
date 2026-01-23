import { Heading, SimpleGrid, Stack } from "@chakra-ui/react";
import { MemberDroppable } from "./MemberDroppable.tsx";
import { MemberBox } from "./MemberBox.tsx";

type Props = {
	restMembers: number[];
};

export function RestMembersPane({ restMembers }: Props) {
	return (
		<Stack>
			<Heading as={"label"} size={"sm"} pl={2}>
				休憩
			</Heading>
			<SimpleGrid columns={2} gap={0}>
				{restMembers.map((memberId) => (
					<MemberDroppable key={memberId} type={"restMember"} memberId={memberId}>
						<MemberBox type={"restMember"} color={"danger.100"} memberId={memberId} />
					</MemberDroppable>
				))}
			</SimpleGrid>
		</Stack>
	);
}
