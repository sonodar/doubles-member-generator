import { type CurrentSettings, type GameMembers, join, leave, replayGenerate, replayRetry } from "@logic";
import { match } from "ts-pattern";
import { client, type Schema } from "./client";

export const EventType = {
	Initialize: "INITIALIZE",
	Join: "JOIN",
	Leave: "LEAVE",
	Generate: "GENERATE",
	Retry: "RETRY",
	Finish: "FINISH",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

type InitializeEventPayload = {
	type: typeof EventType.Initialize;
	payload: CurrentSettings;
};

type JoinEventPayload = {
	type: typeof EventType.Join;
	payload?: never;
};

type LeaveEventPayload = {
	type: typeof EventType.Leave;
	payload: { memberId: number };
};

type GenerateEventPayload = {
	type: typeof EventType.Generate;
	payload: { members: GameMembers };
};

type RetryEventPayload = {
	type: typeof EventType.Retry;
	payload: { members: GameMembers };
};

type FinishEventPayload = {
	type: typeof EventType.Finish;
	payload?: never;
};

export type EventPayload =
	| InitializeEventPayload
	| JoinEventPayload
	| LeaveEventPayload
	| GenerateEventPayload
	| RetryEventPayload
	| FinishEventPayload;

export type Event = EventPayload & {
	id: string;
	occurredAt: Date;
};

type EventModel = Schema["Event"]["type"];

async function emit(environmentID: string, event: EventPayload) {
	await client.models.Event.create({
		environmentID,
		type: event.type,
		payload: JSON.stringify(event.payload ?? {}),
		occurredAt: new Date().toISOString(),
	});
}

export function eventEmitter(envId: string) {
	return {
		initialize: (payload: CurrentSettings) => emit(envId, { type: EventType.Initialize, payload }),
		join: () => emit(envId, { type: EventType.Join }),
		leave: (memberId: number) => emit(envId, { type: EventType.Leave, payload: { memberId } }),
		generate: (members: GameMembers) => emit(envId, { type: EventType.Generate, payload: { members } }),
		retry: (members: GameMembers) => emit(envId, { type: EventType.Retry, payload: { members } }),
		finish: () => emit(envId, { type: EventType.Finish }),
	};
}

export function subscribeEvent(environmentID: string, handler: (event: Event) => void) {
	const subscription = client.models.Event.observeQuery({
		filter: { environmentID: { eq: environmentID } },
	}).subscribe({
		next: ({ items }) => {
			for (const item of items) {
				handler(toEvent(item));
			}
		},
	});

	return {
		unsubscribe: () => subscription.unsubscribe(),
	};
}

export async function findAllEvents(id: string): Promise<Event[]> {
	const { data } = await client.models.Event.list({
		filter: { environmentID: { eq: id } },
	});
	return (data ?? []).map(toEvent).sort((e1: Event, e2: Event) => {
		if (e1.type === EventType.Initialize) return -1;
		if (e1.type === EventType.Finish) return 1;
		return e1.occurredAt.getTime() - e2.occurredAt.getTime();
	});
}

function toEvent(model: EventModel): Event {
	const payload = toPayload(model.payload);
	const occurredAt = new Date(model.occurredAt);
	return {
		id: model.id,
		type: model.type as EventType,
		payload,
		occurredAt,
	} as Event;
}

function toPayload(payload: unknown): EventPayload["payload"] {
	if (typeof payload !== "string") return payload as EventPayload["payload"];
	return JSON.parse(payload);
}

export function replayEvent(settings: CurrentSettings, event: Exclude<Event, InitializeEventPayload>): CurrentSettings {
	return match(event)
		.with({ type: EventType.Generate }, ({ payload }) => replayGenerate(settings, payload.members))
		.with({ type: EventType.Retry }, ({ payload }) => replayRetry(settings, payload.members))
		.with({ type: EventType.Join }, () => join(settings))
		.with({ type: EventType.Leave }, ({ payload }) => leave(settings, payload.memberId))
		.with({ type: EventType.Finish }, () => settings)
		.exhaustive();
}
