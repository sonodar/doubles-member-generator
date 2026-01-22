import { SegmentGroup } from "@chakra-ui/react";
import { type Algorithm, Algorithms } from "@logic";

type Props = { value: Algorithm; onChange: (mode: Algorithm) => void };

const ALGORITHM_ITEMS = [
	{ value: Algorithms.DISCRETENESS, label: "ばらつき重視" },
	{ value: Algorithms.EVENNESS, label: "均等性重視" },
];

export function AlgorithmInput({ value, onChange }: Props) {
	return (
		<SegmentGroup.Root value={value} onValueChange={(e) => e.value && onChange(e.value as Algorithm)}>
			<SegmentGroup.Indicator />
			<SegmentGroup.Items items={ALGORITHM_ITEMS} />
		</SegmentGroup.Root>
	);
}
