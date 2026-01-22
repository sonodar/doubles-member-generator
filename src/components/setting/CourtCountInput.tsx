import { SegmentGroup } from "@chakra-ui/react";
import { array, COURT_COUNT_LIMIT } from "@logic";

type Props = {
	value: number;
	onChange: (i: number) => void;
};

const COURT_IDS = array.generate(COURT_COUNT_LIMIT).map(String);

export function CourtCountInput({ value, onChange }: Props) {
	return (
		<SegmentGroup.Root value={value.toString()} onValueChange={(e) => e.value && onChange(parseInt(e.value, 10))}>
			<SegmentGroup.Indicator />
			<SegmentGroup.Items items={COURT_IDS} />
		</SegmentGroup.Root>
	);
}
