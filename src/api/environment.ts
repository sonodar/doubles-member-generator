import ms from "ms";
import { client } from "./client";

const ttl = (lifetime: number) => Math.floor((Date.now() + lifetime) / 1000);

export async function createEnvironment(): Promise<{ id: string }> {
	const { data } = await client.models.Environment.create({
		ttl: ttl(ms("7d")),
	});
	if (!data) throw new Error("Failed to create environment");
	return { id: data.id };
}

export async function finishEnvironment(id: string): Promise<void> {
	await client.models.Environment.update({
		id,
		finishedAt: new Date().toISOString(),
	});
}
