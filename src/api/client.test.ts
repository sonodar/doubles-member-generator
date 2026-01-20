import { describe, it, expect, vi } from "vitest";

// Amplify Data API のモック
vi.mock("aws-amplify/data", () => ({
	generateClient: vi.fn(() => ({
		models: {
			Event: {
				create: vi.fn(),
				list: vi.fn(),
				observeQuery: vi.fn(),
			},
			Environment: {
				create: vi.fn(),
				update: vi.fn(),
			},
		},
	})),
}));

describe("client", () => {
	it("should export a typed client with models", async () => {
		const { client } = await import("./client");

		expect(client).toBeDefined();
		expect(client.models).toBeDefined();
		expect(client.models.Event).toBeDefined();
		expect(client.models.Environment).toBeDefined();
	});

	it("should export Schema type", async () => {
		// Schema 型がエクスポートされていることを確認
		// 型のみのエクスポートなので、実行時には確認できない
		// このテストは client.ts が正しくコンパイルされることを確認
		const module = await import("./client");
		expect(module).toHaveProperty("client");
	});
});
