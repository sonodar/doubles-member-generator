/**
 * Lambda とフロントエンドで共有する型定義
 * client.ts (amplify_outputs.json) への依存を避けるため、ここに切り出す
 */

import type { CurrentSettings, GameMembers } from "../logic";

export const EventType = {
	Initialize: "INITIALIZE",
	Join: "JOIN",
	Leave: "LEAVE",
	Generate: "GENERATE",
	Retry: "RETRY",
	Finish: "FINISH",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export type InitializeEventPayload = {
	type: typeof EventType.Initialize;
	payload: CurrentSettings;
};

export type JoinEventPayload = {
	type: typeof EventType.Join;
	payload?: never;
};

export type LeaveEventPayload = {
	type: typeof EventType.Leave;
	payload: { memberId: number };
};

export type GenerateEventPayload = {
	type: typeof EventType.Generate;
	payload: { members: GameMembers };
};

export type RetryEventPayload = {
	type: typeof EventType.Retry;
	payload: { members: GameMembers };
};

export type FinishEventPayload = {
	type: typeof EventType.Finish;
	payload?: never;
};

export type EventPayload = (
	| InitializeEventPayload
	| JoinEventPayload
	| LeaveEventPayload
	| GenerateEventPayload
	| RetryEventPayload
	| FinishEventPayload
) & { silent?: boolean };

export type Event = EventPayload & {
	id: string;
	occurredAt: Date;
};

export type PushPayload = {
	title: string;
	body: string;
	icon: string;
	tag: string;
	data: { url: string };
};
