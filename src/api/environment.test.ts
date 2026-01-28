import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted でモック関数を先に作成
const { mockCreate, mockUpdate, mockGet } = vi.hoisted(() => ({
	mockCreate: vi.fn(),
	mockUpdate: vi.fn(),
	mockGet: vi.fn(),
}));

// client モジュールのモック
vi.mock("./client", () => ({
	client: {
		models: {
			Environment: {
				create: mockCreate,
				update: mockUpdate,
				get: mockGet,
			},
		},
	},
}));

// テスト対象のインポートはモック設定後に行う
import { createEnvironment, finishEnvironment, getEnvironment } from "./environment";

describe("environment", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("createEnvironment", () => {
		it("should create environment with ttl (7 days from now)", async () => {
			const now = new Date("2026-01-18T12:00:00.000Z");
			vi.setSystemTime(now);

			const envId = "new-env-id";
			mockCreate.mockResolvedValue({ data: { id: envId } });

			const result = await createEnvironment();

			expect(result).toEqual({ id: envId });
			expect(mockCreate).toHaveBeenCalledWith({
				ttl: expect.any(Number),
			});

			// TTL が 7 日後のタイムスタンプ（秒単位）であることを確認
			const call = mockCreate.mock.calls[0][0];
			const expectedTtl = Math.floor((now.getTime() + 7 * 24 * 60 * 60 * 1000) / 1000);
			expect(call.ttl).toBe(expectedTtl);
		});

		it("should throw error when create fails", async () => {
			mockCreate.mockResolvedValue({ data: null });

			await expect(createEnvironment()).rejects.toThrow("Failed to create environment");
		});
	});

	describe("finishEnvironment", () => {
		it("should update environment with finishedAt timestamp", async () => {
			const now = new Date("2026-01-18T12:00:00.000Z");
			vi.setSystemTime(now);

			const envId = "env-to-finish";
			mockUpdate.mockResolvedValue({ data: { id: envId } });

			await finishEnvironment(envId);

			expect(mockUpdate).toHaveBeenCalledWith({
				id: envId,
				finishedAt: now.toISOString(),
			});
		});
	});

	describe("getEnvironment", () => {
		it("should return environment when it exists", async () => {
			const envId = "existing-env-id";
			mockGet.mockResolvedValue({ data: { id: envId } });

			const result = await getEnvironment(envId);

			expect(result).toEqual({ id: envId });
			expect(mockGet).toHaveBeenCalledWith({ id: envId });
		});

		it("should return null when environment does not exist", async () => {
			mockGet.mockResolvedValue({ data: null });

			const result = await getEnvironment("non-existent-id");

			expect(result).toBeNull();
			expect(mockGet).toHaveBeenCalledWith({ id: "non-existent-id" });
		});
	});
});
