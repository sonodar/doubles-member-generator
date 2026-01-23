import { Box, SimpleGrid } from "@chakra-ui/react";
import type { CourtMembers } from "../../../logic";
import { MemberBox } from "./MemberBox.tsx";
import { MemberDroppable } from "./MemberDroppable.tsx";

type Props = {
	courtId: number;
	courtMembers: CourtMembers;
};

export function CourtMembersBox({ courtId, courtMembers }: Props) {
	return (
		<Box borderStyle={"solid"} borderWidth={1} borderRadius={"md"} py={1} pl={1}>
			<SimpleGrid columns={4} gap={0}>
				{courtMembers.map((memberId) => (
					<MemberDroppable key={memberId} type={"courtMember"} courtId={courtId} memberId={memberId}>
						<MemberBox type={"courtMember"} color={"brand.300"} courtId={courtId} memberId={memberId} />
					</MemberDroppable>
				))}
			</SimpleGrid>
		</Box>
	);
}
