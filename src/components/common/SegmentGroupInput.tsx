import { SegmentGroup } from "@chakra-ui/react";

type Item = {
	value: string;
	label: string;
};

type Props = {
	value: string;
	items: Item[];
	onChange: (value: string) => void;
};

export function SegmentGroupInput({ value, items, onChange }: Props) {
	return (
		<SegmentGroup.Root
			value={value}
			onValueChange={(e) => e.value && onChange(e.value)}
			bg="gray.100"
			width="fit-content"
		>
			<SegmentGroup.Indicator bg="colorPalette.solid" />
			{items.map((item) => (
				<SegmentGroup.Item key={item.value} value={item.value} cursor="pointer">
					<SegmentGroup.ItemText fontWeight="semibold" color="gray.500" _checked={{ color: "colorPalette.contrast" }}>
						{item.label}
					</SegmentGroup.ItemText>
					<SegmentGroup.ItemHiddenInput />
				</SegmentGroup.Item>
			))}
		</SegmentGroup.Root>
	);
}
