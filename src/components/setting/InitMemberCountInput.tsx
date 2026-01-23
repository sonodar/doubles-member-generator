import { Box, HStack, IconButton, Input, Slider, Text, VStack } from "@chakra-ui/react";
import { MEMBER_COUNT_LIMIT } from "@logic";
import { BsArrowsExpandVertical } from "react-icons/bs";
import { MdAdd, MdRemove } from "react-icons/md";

type Props = {
	min: number;
	value: number;
	onChange: (i: number) => void;
};

export function InitMemberCountInput({ min, value, onChange }: Props) {
	return (
		<VStack gap={4}>
			<HStack w={"100%"}>
				<IconButton
					colorPalette={"brand"}
					aria-label="decrement"
					borderRadius="sm"
					disabled={value <= min}
					size={"sm"}
					onClick={() => value > min && onChange(value - 1)}
				>
					<MdRemove />
				</IconButton>
				<Input
					type={"number"}
					value={value}
					step={1}
					min={min}
					max={MEMBER_COUNT_LIMIT}
					textAlign="center"
					width={"20"}
					size={"sm"}
					fontSize={"md"}
					onChange={(e) => onChange(parseInt(e.target.value))}
				/>
				<IconButton
					colorPalette={"brand"}
					aria-label="increment"
					borderRadius="sm"
					disabled={value >= MEMBER_COUNT_LIMIT}
					size={"sm"}
					onClick={() => value < MEMBER_COUNT_LIMIT && onChange(value + 1)}
				>
					<MdAdd />
				</IconButton>
				<Text fontSize="md">(上限 {MEMBER_COUNT_LIMIT} 人)</Text>
			</HStack>
			<Slider.Root
				colorPalette={"brand"}
				min={4}
				max={MEMBER_COUNT_LIMIT}
				value={[value]}
				onValueChange={(details) => onChange(Math.max(min, details.value[0]))}
				w={"100%"}
			>
				<Slider.Control>
					<Slider.Track>
						<Slider.Range />
					</Slider.Track>
					<Slider.Thumb index={0} boxSize={6}>
						<Box color="brand.600" as={BsArrowsExpandVertical} />
					</Slider.Thumb>
				</Slider.Control>
			</Slider.Root>
		</VStack>
	);
}
