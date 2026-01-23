import { Box } from "@chakra-ui/react";
import { useDroppable } from "@dnd-kit/react";
import type { RestOrCourtMember } from "@logic";
import type React from "react";

export function MemberDroppable({ children, ...member }: RestOrCourtMember & { children: React.ReactNode }) {
	const { ref, isDropTarget } = useDroppable({
		id: `${member.type}Droppable-${member.memberId}`,
		data: member,
	});
	const style = {
		background: isDropTarget ? "var(--chakra-colors-gray-100)" : "transparent",
	};
	return (
		<Box w={12} h={12} p={2} rounded={"sm"} ref={ref} style={style}>
			{children}
		</Box>
	);
}
