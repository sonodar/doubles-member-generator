import { Box, Center } from "@chakra-ui/react";
import { useDraggable } from "@dnd-kit/react";
import type { RestOrCourtMember } from "@logic";

export function MemberBox({ color, ...member }: RestOrCourtMember & { color: string }) {
	const { ref, isDragging } = useDraggable({
		id: `${member.type}-${member.memberId}`,
		data: member,
	});
	return (
		<Box w="8" h="8" pt={1} bg={color} borderRadius="full" boxShadow={isDragging ? undefined : "sm"} ref={ref}>
			<Center>{member.memberId}</Center>
		</Box>
	);
}
