import { Box, Center, Heading, HStack, Separator, SimpleGrid, Tabs, Text } from "@chakra-ui/react";
import { useState } from "react";
import {
	array,
	type CurrentSettings,
	type MemberCountVariant,
	memberCountVariantLabels,
	memberCountVariants,
	OutlierLevelProvider,
} from "../../logic";
import { useSettings } from "../state";

type Props = {
	settings?: Pick<CurrentSettings, "histories" | "members" | "gameCounts">;
	showLeftMember?: boolean;
	defaultTabIndex?: number;
};

const outlierLevelColors = {
	none: "",
	low: "highlight.100",
	medium: "highlight.300",
	high: "danger.200",
} as const;

export default function MemberCountPane({ settings, showLeftMember, defaultTabIndex }: Props) {
	const [tabIndex, setTabIndex] = useState(defaultTabIndex || 0);
	const memberCountVariant = memberCountVariants[tabIndex];

	const currentSettings = useSettings();
	const { histories, members, gameCounts } = settings || currentSettings;
	const playMemberIds = Object.keys(gameCounts).map(Number);
	const memberIds = array.sort(array.unique(members.concat(showLeftMember ? playMemberIds : [])));

	const { getLevel, getValue } = OutlierLevelProvider({
		histories,
		members,
		gameCounts,
	});

	function CountPain({ id, variant }: { id: number; playCount?: number; variant: MemberCountVariant }) {
		const value = getValue(variant, id);
		const level = getLevel(variant, id);
		const color = !members.includes(id) ? "gray" : outlierLevelColors[level];

		return (
			<Box bg={color} color={members.includes(id) ? "" : "white"}>
				<Center>
					<HStack gap={3}>
						<Heading as={"label"} size={"md"}>{`${id} :`}</Heading>
						<Text fontSize={"md"}>{value} 回</Text>
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
