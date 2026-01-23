import { SegmentGroupInput } from "@components/common/SegmentGroupInput";
import { COURT_COUNT_LIMIT, array } from "@logic";

type Props = {
	value: number;
	onChange: (i: number) => void;
};

const COURT_ITEMS = array.generate(COURT_COUNT_LIMIT).map((id) => ({
	value: String(id),
	label: String(id),
}));

export function CourtCountInput({ value, onChange }: Props) {
	return <SegmentGroupInput value={value.toString()} items={COURT_ITEMS} onChange={(v) => onChange(parseInt(v, 10))} />;
}
