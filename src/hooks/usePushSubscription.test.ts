import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// PushSubscription のモック
const mockPushSubscription = {
	endpoint: "https://push.example.com/endpoint",
	getKey: vi.fn((name: string) => {
		if (name === "p256dh") return new Uint8Array([1, 2, 3, 4]).buffer;
		if (name === "auth") return new Uint8Array([5, 6, 7, 8]).buffer;
		return null;
	}),
};

// ServiceWorkerRegistration のモック
const mockPushManager = {
	getSubscription: vi.fn().mockResolvedValue(null),
	subscribe: vi.fn().mockResolvedValue(mockPushSubscription),
};

const mockServiceWorkerRegistration = {
	pushManager: mockPushManager,
} as unknown as ServiceWorkerRegistration;

// API のモック
vi.mock("../api", async () => {
	const actual = await vi.importActual<typeof import("../api")>("../api");
	return {
		...actual,
		createPushSubscription: vi.fn(),
	};
});

import { createPushSubscription } from "../api";
import { usePushSubscription } from "./usePushSubscription";

const mockCreatePushSubscription = vi.mocked(createPushSubscription);

describe("usePushSubscription", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCreatePushSubscription.mockResolvedValue({ id: "subscription-id" });

		// serviceWorker のモック
		Object.defineProperty(navigator, "serviceWorker", {
			value: {
				getRegistration: vi.fn().mockResolvedValue(undefined),
				getRegistrations: vi.fn().mockResolvedValue([]),
				register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
				ready: Promise.resolve(mockServiceWorkerRegistration),
			},
			writable: true,
			configurable: true,
		});

		// Notification のモック
		Object.defineProperty(window, "Notification", {
			value: {
				permission: "default" as NotificationPermission,
				requestPermission: vi.fn().mockResolvedValue("granted"),
			},
			writable: true,
			configurable: true,
		});

		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	describe("subscribe()", () => {
		it("Notification.requestPermission を呼び出す", async () => {
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(Notification.requestPermission).toHaveBeenCalled();
		});

		it("許可後に navigator.serviceWorker.register を呼び出す", async () => {
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
		});

		it("SW 登録後に pushManager.subscribe を呼び出す", async () => {
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(mockPushManager.subscribe).toHaveBeenCalledWith({
				userVisibleOnly: true,
				applicationServerKey: expect.any(Uint8Array),
			});
		});

		it("購読成功後に createPushSubscription API を呼び出す", async () => {
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(mockCreatePushSubscription).toHaveBeenCalledWith({
				environmentID: "test-env-id",
				endpoint: "https://push.example.com/endpoint",
				p256dh: expect.any(String),
				auth: expect.any(String),
			});
		});

		it("API 成功後に status を subscribed に設定する", async () => {
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			expect(result.current.status).toBe("permission-needed");

			await act(async () => {
				await result.current.subscribe();
			});

			expect(result.current.status).toBe("subscribed");
		});

		it("通知が拒否された場合は SW 登録をスキップする", async () => {
			vi.mocked(Notification.requestPermission).mockResolvedValue("denied");

			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
			expect(result.current.status).toBe("denied");
		});

		it("onSubscriptionChange コールバックが呼ばれる", async () => {
			const onSubscriptionChange = vi.fn();
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
					onSubscriptionChange,
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(onSubscriptionChange).toHaveBeenCalledWith(true);
		});

		it("購読状態が localStorage に永続化される", async () => {
			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			const stored = localStorage.getItem("pushSubscription:test-env-id");
			expect(stored).toBe("true");
		});

		it("environmentId ごとに購読状態が分離される", async () => {
			// env-1 で購読
			const { result: result1 } = renderHook(() =>
				usePushSubscription({
					environmentId: "env-1",
				}),
			);

			await act(async () => {
				await result1.current.subscribe();
			});

			expect(result1.current.status).toBe("subscribed");
			expect(localStorage.getItem("pushSubscription:env-1")).toBe("true");

			// env-2 は未購読であることを確認
			// 注: 実際のブラウザでは Notification.permission がグローバルなので
			// env-1 で許可後は env-2 も "ready" 状態になるが、
			// このテストでは localStorage の分離を検証する
			expect(localStorage.getItem("pushSubscription:env-2")).toBeNull();
		});
	});

	describe("isSubscribing", () => {
		it("subscribe 中は isSubscribing が true になる", async () => {
			let resolvePermission: (value: NotificationPermission) => void;
			vi.mocked(Notification.requestPermission).mockImplementation(
				() =>
					new Promise((resolve) => {
						resolvePermission = resolve;
					}),
			);

			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			expect(result.current.isSubscribing).toBe(false);

			let subscribePromise: Promise<void>;
			act(() => {
				subscribePromise = result.current.subscribe();
			});

			await waitFor(() => {
				expect(result.current.isSubscribing).toBe(true);
			});

			await act(async () => {
				resolvePermission!("granted");
				await subscribePromise;
			});

			expect(result.current.isSubscribing).toBe(false);
		});
	});

	describe("status", () => {
		it("Notification.permission が granted の場合、status は ready になる", () => {
			Object.defineProperty(Notification, "permission", {
				value: "granted",
				writable: true,
				configurable: true,
			});

			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			expect(result.current.status).toBe("ready");
		});

		it("subscribe で拒否された場合、status は denied になる", async () => {
			vi.mocked(Notification.requestPermission).mockResolvedValue("denied");

			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			await act(async () => {
				await result.current.subscribe();
			});

			expect(result.current.status).toBe("denied");
		});
	});

	describe("永続化された購読状態の復元", () => {
		it("localStorage から購読状態を復元する", () => {
			localStorage.setItem("pushSubscription:test-env-id", "true");

			const { result } = renderHook(() =>
				usePushSubscription({
					environmentId: "test-env-id",
				}),
			);

			expect(result.current.status).toBe("subscribed");
		});
	});
});
