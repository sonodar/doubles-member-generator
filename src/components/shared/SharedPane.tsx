import { useEffect, useState } from "react";
import { Alert, Card, Center, HStack, Heading, IconButton, Link, Spacer } from "@chakra-ui/react";
import { toaster } from "@components/theme.ts";
import { MdRefresh } from "react-icons/md";
import { match } from "ts-pattern";
import { atom } from "jotai";
import { useReducerAtom } from "jotai/utils";
import HistoryPane from "../common/HistoryPane.tsx";
import { EventType, type Event, findAllEvents, replayEvent, subscribeEvent } from "@api";
import { MemberButton } from "@components/common/MemberButton.tsx";
import { emptySettings, settingsReducer } from "@components/state";
import type { CurrentSettings } from "@logic";
import { AlgorithmBadge } from "@components/common/AlgorithmBadge.tsx";
import { MdHome } from "react-icons/md";

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
	const [event, setEvent] = useState<Event | null>(null);
	const [subscribed, setSubscribed] = useState(false);

	const proceededEvents: Record<string, Event> = {};

	useEffect(() => {
		findAllEvents(sharedId).then((events) => {
			if (!subscribed) {
				startSubscribe(sharedId);
			}
			if (events.length === 0) {
				return;
			}
			const { settings, finished, proceeded } = replayEvents(events);
			for (const [id, event] of Object.entries(proceeded)) {
				proceededEvents[id] = event;
			}
			dispatch({ type: EventType.Initialize, payload: settings });
			setFinished(finished);
		});
	}, [sharedId, dispatch, subscribed]);

	const startSubscribe = (id: string) => {
		setSubscribed(true);
		const { unsubscribe } = subscribeEvent(id, (event: Event) => {
			// 処理済みのイベントなら何もしない
			if (proceededEvents[event.id]) return;

			// 終了イベントなら unsubscribe する
			if (event.type === EventType.Finish) {
				unsubscribe();
				// setFinished(true) // setEvent の後に呼ばれるのでここではやらない
			}

			// イベントの各処理をトリガー（useEffectが発火する）
			setEvent(event);
		});
	};

	useEffect(() => {
		if (!event || event.type === EventType.Initialize) return;
		proceededEvents[event.id] = event;

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
	}, [event, dispatch]);

	return (
		<Card.Root my={1} py={4}>
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
	const proceeded: Record<string, Event> = {};
	const [init, ...events] = allEvents;

	if (init.type !== EventType.Initialize) {
		throw new Error(`Invalid first event type: ${init.type}`);
	}

	let finished = false;
	proceeded[init.id] = init;

	const settings = events.reduce((settings, event) => {
		if (event.type === EventType.Initialize) return settings;
		finished = finished || event.type === EventType.Finish;
		proceeded[event.id] = event;
		return replayEvent(settings, event);
	}, init.payload);

	return { settings, proceeded, finished };
}
