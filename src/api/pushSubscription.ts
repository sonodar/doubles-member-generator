import { client } from "./client";

export interface CreatePushSubscriptionInput {
	environmentID: string;
	endpoint: string;
	p256dh: string;
	auth: string;
}

export async function createPushSubscription(input: CreatePushSubscriptionInput): Promise<{ id: string }> {
	const { data } = await client.models.PushSubscription.create(input);
	if (!data) throw new Error("Failed to create push subscription");
	return { id: data.id };
}
