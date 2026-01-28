import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSsmSend = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-ssm", () => ({
	SSMClient: class MockSSMClient {
		send = mockSsmSend;
	},
	GetParameterCommand: class MockGetParameterCommand {
		constructor(public params: unknown) {}
	},
}));

describe("setupVapidDetails", () => {
	const mockSetVapidDetails = vi.fn();

	beforeEach(async () => {
		vi.clearAllMocks();
		// モジュールをリセットして vapidConfigured フラグをクリア
		vi.resetModules();
	});

	it("公開鍵が空の場合はエラーを投げる", async () => {
		const { setupVapidDetails } = await import("./setup");

		await expect(setupVapidDetails("", "/test/param", mockSetVapidDetails)).rejects.toThrow(
			"Missing VAPID configuration: publicKey or privateKeyParam is empty",
		);
		expect(mockSsmSend).not.toHaveBeenCalled();
	});

	it("秘密鍵パラメータが空の場合はエラーを投げる", async () => {
		const { setupVapidDetails } = await import("./setup");

		await expect(setupVapidDetails("public-key", "", mockSetVapidDetails)).rejects.toThrow(
			"Missing VAPID configuration: publicKey or privateKeyParam is empty",
		);
		expect(mockSsmSend).not.toHaveBeenCalled();
	});

	it("SSM から秘密鍵を取得して VAPID を設定する", async () => {
		mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "private-key" } });
		const { setupVapidDetails } = await import("./setup");

		await setupVapidDetails("public-key", "/test/param", mockSetVapidDetails);

		expect(mockSsmSend).toHaveBeenCalled();
		expect(mockSetVapidDetails).toHaveBeenCalledWith("mailto:noreply@example.com", "public-key", "private-key");
	});

	it("SSM から秘密鍵を取得できない場合はエラーを投げる", async () => {
		mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "" } });
		const { setupVapidDetails } = await import("./setup");

		await expect(setupVapidDetails("public-key", "/test/param", mockSetVapidDetails)).rejects.toThrow(
			"Failed to fetch VAPID private key from /test/param",
		);
		expect(mockSetVapidDetails).not.toHaveBeenCalled();
	});

	it("2回目以降の呼び出しでは SSM を呼ばない", async () => {
		mockSsmSend.mockResolvedValueOnce({ Parameter: { Value: "private-key" } });
		const { setupVapidDetails } = await import("./setup");

		await setupVapidDetails("public-key", "/test/param", mockSetVapidDetails);
		await setupVapidDetails("public-key", "/test/param", mockSetVapidDetails);

		expect(mockSsmSend).toHaveBeenCalledTimes(1);
		expect(mockSetVapidDetails).toHaveBeenCalledTimes(1);
	});
});
