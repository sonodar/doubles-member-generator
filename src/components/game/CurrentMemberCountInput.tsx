import { Button, HStack, Input, Spacer, useDisclosure } from "@chakra-ui/react";
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
		<HStack maxW={"320px"} minW={"320px"}>
			<span>現在</span>
			<Input
				type={"number"}
				value={members.length}
				step={1}
				min={min}
				max={MEMBER_COUNT_LIMIT}
				style={{ textAlign: "center" }}
				width={"14"}
				border={""}
				readOnly
			/>
			<span>人</span>
			<Spacer />
			<Button
				size={"sm"}
				colorScheme={"brand"}
				variant={"solid"}
				onClick={onIncrement}
				disabled={disabled || members.length >= MEMBER_COUNT_LIMIT}
			>
				<TbUserPlus />
				参加
			</Button>
			<Button
				size={"sm"}
				variant={"outline"}
				colorScheme={"brand"}
				onClick={onOpen}
				disabled={disabled || members.length <= min}
			>
				<TbUserOff />
				離脱
			</Button>
			<LeaveDialog members={members} open={open} onClose={onClose} onLeave={onDecrement} />
		</HStack>
	);
}
