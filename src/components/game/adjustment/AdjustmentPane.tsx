import { Grid, GridItem, Heading, Stack, Text } from "@chakra-ui/react";
import { CourtMembersBox } from "@components/game/adjustment/CourtMembersBox.tsx";
import { RestMembersPane } from "@components/game/adjustment/RestMembersPane.tsx";
import { toaster } from "@components/theme.ts";
import { PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
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

	const handleDragEnd: React.ComponentProps<typeof DragDropProvider>["onDragEnd"] = (event) => {
		if (event.canceled) return;

		const source = event.operation.source;
		const target = event.operation.target;

		if (!source?.data || !target?.data) {
			return;
		}

		const sourceType = source.data.type;
		const destType = target.data.type;

		if (!isMemberType(sourceType) || !isMemberType(destType)) {
			throw new Error("Invalid member type");
		}

		const sourceMember = source.data as RestOrCourtMember;
		const destMember = target.data as RestOrCourtMember;

		const newGameMembers = swapGameMember(gameMembers, sourceMember, destMember);
		if (!newGameMembers) return;

		onChange(newGameMembers);
		showToast(sourceMember.memberId, destMember.memberId);
	};

	const leftSpan = 3;
	const rightSpan = 5;
	const columnGap = 5;

	// ドラッグ開始までのディレイを最小化（距離制約なし）
	const sensors = [PointerSensor.configure({ activationConstraints: [] })];

	return (
		<DragDropProvider onDragEnd={handleDragEnd} sensors={sensors}>
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
		</DragDropProvider>
	);
}
