import { Button, HStack, Input, Spacer, Text, useDisclosure } from "@chakra-ui/react";
import { TbUserOff, TbUserPlus } from "react-icons/tb";
import { COURT_CAPACITY, MEMBER_COUNT_LIMIT } from "@logic";
import { LeaveDialog } from "@components/game/LeaveDialog";
import { useSettings } from "@components/state";

type Props = {
	onIncrement: () => void;
	onDecrement: (id: number) => void;
	disabled?: boolean;
};

export function CurrentMemberCountInput({ onIncrement, onDecrement, disabled }: Props) {
	const { members, courtCount } = useSettings();
	const min = courtCount * COURT_CAPACITY;
	const { open, onOpen, onClose } = useDisclosure();

	return (
		<HStack w={"100%"}>
			<Text fontSize={"sm"}>現在</Text>
			<Input
				type={"number"}
				value={members.length}
				step={1}
				size={"lg"}
				min={min}
				max={MEMBER_COUNT_LIMIT}
				textAlign="center"
				width={"14"}
				variant="flushed"
				borderBottom="none"
				readOnly
			/>
			<Text fontSize={"sm"}>人</Text>
			<Spacer />
			<Button
				size={"xs"}
				variant={"solid"}
				onClick={onIncrement}
				disabled={disabled || members.length >= MEMBER_COUNT_LIMIT}
			>
				<TbUserPlus />
				参加
			</Button>
			<Button size={"xs"} variant={"outline"} onClick={onOpen} disabled={disabled || members.length <= min}>
				<TbUserOff />
				離脱
			</Button>
			<LeaveDialog members={members} open={open} onClose={onClose} onLeave={onDecrement} />
		</HStack>
	);
}
