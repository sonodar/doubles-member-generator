import { Box, Center, Heading, HStack, Separator, SimpleGrid, Tabs, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
	array,
	type CurrentSettings,
	calculateWarningThresholds,
	detectWarnings,
	type MemberCountVariant,
	memberCountVariantLabels,
	memberCountVariants,
	OutlierLevelProvider,
	type WarningState,
	type WarningType,
} from "../../logic";
import { useSettings } from "../state";
import WarningIndicator from "./WarningIndicator";

type Props = {
	settings?: CurrentSettings;
	showLeftMember?: boolean;
	defaultTabIndex?: number;
};

const outlierLevelColors = {
	none: "",
	low: "highlight.100",
	medium: "highlight.300",
	high: "danger.200",
} as const;

// タブ種別と警告種別のマッピング
const tabToWarningType: Record<MemberCountVariant, WarningType | null> = {
	playCount: "playCountDiff",
	restCount: "consecutiveRest",
	totalRestCount: null, // 総休憩は警告対象外
};

export default function MemberCountPane({ settings, showLeftMember, defaultTabIndex }: Props) {
	const [tabIndex, setTabIndex] = useState(defaultTabIndex || 0);
	const memberCountVariant = memberCountVariants[tabIndex];

	const currentSettings = useSettings();
	const effectiveSettings = settings || currentSettings;
	const { histories, members, gameCounts, courtCount, algorithm } = effectiveSettings;
	const playMemberIds = Object.keys(gameCounts).map(Number);
	const memberIds = array.sort(array.unique(members.concat(showLeftMember ? playMemberIds : [])));

	const { getLevel, getValue } = OutlierLevelProvider({
		histories,
		members,
		gameCounts,
	});

	// 警告状態を計算
	const warningState: WarningState = useMemo(() => {
		const thresholds = calculateWarningThresholds({
			courtCount,
			memberCount: members.length,
			algorithm,
		});
		return detectWarnings(effectiveSettings, thresholds);
	}, [effectiveSettings, courtCount, members.length, algorithm]);

	// 現在のタブに対応する警告種別でフィルタ
	const currentWarningType = tabToWarningType[memberCountVariant];
	const filteredWarningState: WarningState = useMemo(
		() => ({
			...warningState,
			warnings: currentWarningType ? warningState.warnings.filter((w) => w.type === currentWarningType) : [],
			hasWarnings: currentWarningType ? warningState.warnings.some((w) => w.type === currentWarningType) : false,
		}),
		[warningState, currentWarningType],
	);

	function CountPain({ id, variant }: { id: number; playCount?: number; variant: MemberCountVariant }) {
		const value = getValue(variant, id);
		const level = getLevel(variant, id);
		const color = !members.includes(id) ? "gray" : outlierLevelColors[level];

		return (
			<Box bg={color} color={members.includes(id) ? "" : "white"} data-member-id={id} data-highlight={level}>
				<Center>
					<HStack gap={1}>
						<Box w="2em" textAlign="right">
							<Heading as={"label"} size={"md"}>
								{id}
							</Heading>
						</Box>
						<Heading as={"label"} size={"md"}>
							:
						</Heading>
						<Box w="2em" textAlign="right">
							<Text fontSize={"md"}>{value}</Text>
						</Box>
						<Text fontSize={"md"}>回</Text>
						<Box w="1em" display="flex" justifyContent="center">
							<WarningIndicator memberId={id} warningState={filteredWarningState} size="sm" />
						</Box>
					</HStack>
				</Center>
				{members.includes(id) && <Separator />}
			</Box>
		);
	}

	return (
		<Tabs.Root value={String(tabIndex)} onValueChange={(e) => setTabIndex(Number(e.value))} variant={"enclosed"}>
			<Tabs.List mb="1em">
				{Object.entries(memberCountVariantLabels).map(([key, label]) => (
					<Tabs.Trigger key={key} value={String(memberCountVariants.indexOf(key as MemberCountVariant))}>
						<Heading size="xs">{label}</Heading>
					</Tabs.Trigger>
				))}
			</Tabs.List>
			<SimpleGrid minChildWidth="110px" gap={0} color={"gray.600"}>
				{memberIds.map((id) => (
					<CountPain key={id} id={id} variant={memberCountVariant} />
				))}
			</SimpleGrid>
		</Tabs.Root>
	);
}
