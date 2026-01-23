import { Box, Center } from "@chakra-ui/react";
import { useDraggable } from "@dnd-kit/core";
import type { RestOrCourtMember } from "@logic";

export function MemberBox({ color, ...member }: RestOrCourtMember & { color: string }) {
	const { isDragging, attributes, listeners, setNodeRef, transform } = useDraggable({
		id: `${member.type}-${member.memberId}`,
		data: member,
	});
	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
		  }
		: undefined;
	return (
		<Box
			w="8"
			h="8"
			pt={1}
			bg={color}
			borderRadius="full"
			boxShadow={isDragging ? undefined : "sm"}
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
		>
			<Center>{member.memberId}</Center>
		</Box>
	);
}
