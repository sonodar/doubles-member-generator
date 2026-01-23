import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Grid, GridItem, Heading, Stack, Text } from "@chakra-ui/react";
import {
	array,
	type CurrentSettings,
	type GameMembers,
	getLatestMembers,
	getRestMembers,
	isMemberType,
	type RestOrCourtMember,
	swapGameMember,
} from "@logic";
import { RestMembersPane } from "@components/game/adjustment/RestMembersPane.tsx";
import { CourtMembersBox } from "@components/game/adjustment/CourtMembersBox.tsx";
import { toaster } from "@components/theme.ts";

type Props = Pick<CurrentSettings, "courtCount" | "members" | "histories"> & {
	onChange: (gameMembers: GameMembers) => void;
};

export function AdjustmentPane({ courtCount, members, histories, onChange }: Props) {
	const gameMembers = getLatestMembers({ histories });

	if (!gameMembers) return null;

	const restMembers = getRestMembers({ members }, gameMembers);
	const courtIds = array.generate(courtCount, 0);

	const showToast = (sourceMemberId: number, destMemberId: number) => {
		toaster.create({
			title: `${sourceMemberId} 番と ${destMemberId} 番を入れ替えました`,
			type: "success",
			duration: 2000,
		});
	};

	const onDragEnd = (e: DragEndEvent) => {
		if (!e.active.data.current || !e.over?.data.current) {
			return;
		}

		const sourceType = e.active.data.current.type;
		const destType = e.over.data.current.type;

		if (!isMemberType(sourceType) || !isMemberType(destType)) {
			throw new Error("Invalid member type");
		}

		const source = e.active.data.current as RestOrCourtMember;
		const dest = e.over.data.current as RestOrCourtMember;

		const newGameMembers = swapGameMember(gameMembers, source, dest);
		if (!newGameMembers) return;

		onChange(newGameMembers);
		showToast(source.memberId, dest.memberId);
	};

	const leftSpan = 3;
	const rightSpan = 5;
	const columnGap = 5;

	return (
		<DndContext onDragEnd={onDragEnd} autoScroll={false}>
			<Stack gap={4} w={"100%"}>
				<Text fontSize={"sm"}>↓ ドラッグ＆ドロップで調整できます ↓</Text>
				<Grid
					templateColumns={`repeat(${leftSpan + rightSpan}, 1fr)`}
					templateRows={`repeat(${courtCount}, 1fr)`}
					columnGap={columnGap}
				>
					{restMembers.length > 0 && (
						<GridItem colSpan={leftSpan} rowSpan={courtCount}>
							<RestMembersPane restMembers={restMembers} />
						</GridItem>
					)}
					{courtIds.map((courtId) => (
						<GridItem colSpan={rightSpan} rowSpan={1} key={`court-${courtId}`}>
							<Heading as={"label"} size={"sm"}>
								コート {courtId + 1}
							</Heading>
							<CourtMembersBox courtId={courtId} courtMembers={gameMembers[courtId]} />
						</GridItem>
					))}
				</Grid>
			</Stack>
		</DndContext>
	);
}
