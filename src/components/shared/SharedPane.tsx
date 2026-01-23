import { Alert, Card, Center, Heading, HStack, IconButton, Link, Spacer } from "@chakra-ui/react";
import { atom } from "jotai";
import { useCallback, useState } from "react";
import { MdHome, MdRefresh } from "react-icons/md";
import { match } from "ts-pattern";
import { type Event, EventType, getEnvironment, replayEvent } from "../../api";
import { useRealtimeSync } from "../../hooks";
import type { CurrentSettings } from "../../logic";
import { AlgorithmBadge } from "../common/AlgorithmBadge.tsx";
import HistoryPane from "../common/HistoryPane.tsx";
import { MemberButton } from "../common/MemberButton.tsx";
import { emptySettings, settingsReducer, useReducerAtom } from "../state";
import { toaster } from "../theme.ts";

// ゲーム画面と違い、オンメモリの atom を利用する。
// こうしないと同一ブラウザで共有画面を開いたときに同じ localStorage に書き込みをしてしまう。
// 実際の利用シーンでは困らないが、開発・テストで困るので。
const settingsAtom = atom<CurrentSettings>(emptySettings);

// biome-ignore lint/suspicious/noExplicitAny: ここでの any は仕方ない
function getMessage(type: EventType): (payload: any) => string {
	return match(type)
		.with(EventType.Initialize, () => () => "共有が開始されました")
		.with(EventType.Join, () => () => "メンバーが追加されました")
		.with(
			EventType.Leave,
			() =>
				({ memberId }: { memberId: number }) =>
					`メンバー ${memberId} が離脱しました`,
		)
		.with(EventType.Generate, () => () => "新しい組み合わせが決定しました")
		.with(EventType.Retry, () => () => "組み合わせをやり直しました")
		.with(EventType.Finish, () => () => "終了しました")
		.exhaustive();
}

function getMessageStatus(type: EventType): "success" | "warning" | "info" | "error" {
	return match(type)
		.with(EventType.Initialize, () => "info" as const)
		.with(EventType.Join, () => "success" as const)
		.with(EventType.Leave, () => "warning" as const)
		.with(EventType.Generate, () => "success" as const)
		.with(EventType.Retry, () => "warning" as const)
		.with(EventType.Finish, () => "error" as const)
		.exhaustive();
}

export default function SharedPane({ sharedId }: { sharedId: string }) {
	const [settings, dispatch] = useReducerAtom(settingsAtom, settingsReducer);
	const [finished, setFinished] = useState(false);
	const [notFound, setNotFound] = useState(false);

	// onEvent: 個別イベント受信時のコールバック
	const handleEvent = useCallback(
		(event: Event) => {
			if (event.type === EventType.Initialize) return;

			if (event.type === EventType.Finish) {
				setFinished(true);
			} else {
				match(event)
					.with({ type: EventType.Generate }, ({ payload }) => dispatch({ type: EventType.Generate, payload }))
					.with({ type: EventType.Retry }, ({ payload }) => dispatch({ type: EventType.Retry, payload }))
					.with({ type: EventType.Join }, () => dispatch({ type: EventType.Join }))
					.with({ type: EventType.Leave }, ({ payload }) => dispatch({ type: EventType.Leave, payload }))
					.exhaustive();
			}

			toaster.create({
				title: getMessage(event.type)(event.payload),
				type: getMessageStatus(event.type),
				duration: 2000,
			});
		},
		[dispatch],
	);

	// onSync: 全イベント取得後のコールバック（初期化・復帰時）
	const handleSync = useCallback(
		async (events: Event[]) => {
			// イベントが空の場合、Environment の存在確認を行う
			if (events.length === 0) {
				const env = await getEnvironment(sharedId);
				if (!env) {
					setNotFound(true);
				}
				return;
			}
			const { settings, finished } = replayEvents(events);
			dispatch({ type: EventType.Initialize, payload: settings });
			setFinished(finished);
		},
		[dispatch, sharedId],
	);

	// useRealtimeSync フックを使用してライフサイクル管理を委譲
	useRealtimeSync({
		sharedId,
		onEvent: handleEvent,
		onSync: handleSync,
	});

	if (notFound) {
		return (
			<Card.Root w="100%" my={1} py={4} borderWidth={0} boxShadow="none">
				<Alert.Root status="error" data-testid="not-found-alert">
					<Alert.Indicator />
					<Alert.Content>
						<Alert.Title>共有されたイベントが見つかりません</Alert.Title>
						<Alert.Description>終了から一定期間経過すると自動で削除されます。</Alert.Description>
					</Alert.Content>
				</Alert.Root>
			</Card.Root>
		);
	}

	return (
		<Card.Root w="100%" my={1} py={4} borderWidth={0} boxShadow="none">
			{finished && (
				<Alert.Root status="error" mb={2}>
					<Alert.Indicator />
					<Alert.Title>すでに終了しています</Alert.Title>
				</Alert.Root>
			)}
			<Card.Header my={0} py={0}>
				<HStack>
					<Heading size={"md"}>
						{settings.members.length} 人が参加{!finished && "中"}
					</Heading>
					<Spacer />
					{!finished && <MemberButton />}
					{!finished && (
						<IconButton
							size={"sm"}
							rounded={"full"}
							variant={"solid"}
							colorPalette={"brand"}
							fontSize={"md"}
							onClick={() => window.location.reload()}
							aria-label={"reload"}
						>
							<MdRefresh />
						</IconButton>
					)}
					{finished && (
						<Link href={"/"}>
							<IconButton size={"sm"} variant={"solid"} fontSize={"md"} aria-label={"Home"}>
								<MdHome />
							</IconButton>
						</Link>
					)}
				</HStack>
			</Card.Header>
			<Card.Body>
				<Center mb={4}>
					<AlgorithmBadge algorithm={settings.algorithm} />
				</Center>
				<Center>
					<HistoryPane histories={settings.histories} />
				</Center>
			</Card.Body>
		</Card.Root>
	);
}

function replayEvents(allEvents: Event[]) {
	const [init, ...events] = allEvents;

	if (init.type !== EventType.Initialize) {
		throw new Error(`Invalid first event type: ${init.type}`);
	}

	let finished = false;

	const settings = events.reduce((settings, event) => {
		if (event.type === EventType.Initialize) return settings;
		finished = finished || event.type === EventType.Finish;
		return replayEvent(settings, event);
	}, init.payload);

	return { settings, finished };
}
