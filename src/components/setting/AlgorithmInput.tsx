import { type Algorithm, Algorithms } from "@logic";
import { SegmentGroupInput } from "@components/common/SegmentGroupInput";

type Props = {
	value: Algorithm;
	onChange: (mode: Algorithm) => void;
};

const ALGORITHM_ITEMS = [
	{ value: Algorithms.EVENNESS, label: "均等性重視" },
	{ value: Algorithms.DISCRETENESS, label: "ばらつき重視" },
];

export function AlgorithmInput({ value, onChange }: Props) {
	return <SegmentGroupInput value={value} items={ALGORITHM_ITEMS} onChange={(v) => onChange(v as Algorithm)} />;
}
