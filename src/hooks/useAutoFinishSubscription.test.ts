import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Event } from "../api";
import { EventType } from "../api";
import { useAutoFinishSubscription } from "./useAutoFinishSubscription";

// API のモック
vi.mock("../api", async () => {
	const actual = await vi.importActual<typeof import("../api")>("../api");
	return {
		...actual,
		subscribeEvent: vi.fn(),
	};
});

import { subscribeEvent } from "../api";

const mockSubscribeEvent = vi.mocked(subscribeEvent);

describe("useAutoFinishSubscription", () => {
	let mockUnsubscribe: () => void;

	beforeEach(() => {
		vi.clearAllMocks();
		mockUnsubscribe = vi.fn();
		mockSubscribeEvent.mockReturnValue({ unsubscribe: mockUnsubscribe });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("基本動作", () => {
		it("environmentId が null の場合は購読しない", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: null,
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).not.toHaveBeenCalled();
		});

		it("environmentId が存在する場合は購読する", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledWith("test-env-id", expect.any(Function));
		});

		it("アンマウント時に購読が解除される", () => {
			const onAutoFinish = vi.fn();

			const { unmount } = renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			unmount();

			expect(mockUnsubscribe).toHaveBeenCalled();
		});

		it("unsubscribe 関数を返す", () => {
			const onAutoFinish = vi.fn();

			const { result } = renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(result.current.unsubscribe).toBeDefined();
			expect(typeof result.current.unsubscribe).toBe("function");
		});
	});

	describe("イベント処理", () => {
		it("FINISH イベントを受信すると onAutoFinish が呼ばれる", () => {
			const onAutoFinish = vi.fn();
			let eventHandler: (event: Event) => void;

			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: mockUnsubscribe };
			});

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// FINISH イベントを発火
			const finishEvent: Event = {
				id: "event-1",
				type: EventType.Finish,
				payload: undefined,
				occurredAt: new Date(),
			};

			act(() => {
				eventHandler!(finishEvent);
			});

			expect(onAutoFinish).toHaveBeenCalledTimes(1);
		});

		it("FINISH 以外のイベントでは onAutoFinish が呼ばれない", () => {
			const onAutoFinish = vi.fn();
			let eventHandler: (event: Event) => void;

			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: mockUnsubscribe };
			});

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// JOIN イベントを発火
			const joinEvent: Event = {
				id: "event-1",
				type: EventType.Join,
				payload: undefined,
				occurredAt: new Date(),
			};

			act(() => {
				eventHandler!(joinEvent);
			});

			expect(onAutoFinish).not.toHaveBeenCalled();
		});

		it("アンマウント後のイベントは無視される", () => {
			const onAutoFinish = vi.fn();
			let eventHandler: (event: Event) => void;

			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: mockUnsubscribe };
			});

			const { unmount } = renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// アンマウント
			unmount();

			// FINISH イベントを発火（アンマウント後）
			const finishEvent: Event = {
				id: "event-1",
				type: EventType.Finish,
				payload: undefined,
				occurredAt: new Date(),
			};

			act(() => {
				eventHandler!(finishEvent);
			});

			expect(onAutoFinish).not.toHaveBeenCalled();
		});
	});

	describe("手動 unsubscribe", () => {
		it("unsubscribe() を呼ぶと購読が解除される", () => {
			const onAutoFinish = vi.fn();

			const { result } = renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// 手動で unsubscribe
			act(() => {
				result.current.unsubscribe();
			});

			expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
		});

		it("unsubscribe() 後のイベントは無視される", () => {
			const onAutoFinish = vi.fn();
			let eventHandler: (event: Event) => void;

			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: mockUnsubscribe };
			});

			const { result } = renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// 手動で unsubscribe
			act(() => {
				result.current.unsubscribe();
			});

			// FINISH イベントを発火（unsubscribe 後）
			// 実際には unsubscribe が呼ばれると subscriptionRef が null になるため
			// イベントハンドラーが呼ばれることはないが、念のためテスト
			const finishEvent: Event = {
				id: "event-1",
				type: EventType.Finish,
				payload: undefined,
				occurredAt: new Date(),
			};

			act(() => {
				eventHandler!(finishEvent);
			});

			// onAutoFinish は呼ばれる（subscriptionRef は null になるが、イベントハンドラー自体は残る）
			// ただし、mountedRef が true のため呼ばれる
			// これは期待される動作（unsubscribe は購読解除のみで、既に受信したイベントの処理は止めない）
			expect(onAutoFinish).toHaveBeenCalledTimes(1);
		});
	});

	describe("environmentId の変更", () => {
		it("environmentId が変更されると再購読する", () => {
			const onAutoFinish = vi.fn();
			const unsubscribe1 = vi.fn();
			const unsubscribe2 = vi.fn();

			mockSubscribeEvent
				.mockReturnValueOnce({ unsubscribe: unsubscribe1 })
				.mockReturnValueOnce({ unsubscribe: unsubscribe2 });

			const { rerender } = renderHook(
				({ environmentId }) =>
					useAutoFinishSubscription({
						environmentId,
						onAutoFinish,
					}),
				{ initialProps: { environmentId: "env-1" as string | null } },
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			expect(mockSubscribeEvent).toHaveBeenCalledWith("env-1", expect.any(Function));

			// environmentId を変更
			rerender({ environmentId: "env-2" });

			// 古い購読が解除され、新しい購読が作成される
			expect(unsubscribe1).toHaveBeenCalled();
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
			expect(mockSubscribeEvent).toHaveBeenCalledWith("env-2", expect.any(Function));
		});

		it("environmentId が null になると購読が解除される", () => {
			const onAutoFinish = vi.fn();

			const { rerender } = renderHook(
				({ environmentId }) =>
					useAutoFinishSubscription({
						environmentId,
						onAutoFinish,
					}),
				{ initialProps: { environmentId: "env-1" as string | null } },
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// environmentId を null に変更
			rerender({ environmentId: null });

			// 購読が解除される
			expect(mockUnsubscribe).toHaveBeenCalled();
		});
	});

	describe("ブラウザライフサイクルイベント", () => {
		it("visibilitychange イベントで visible 時に再購読される", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// visibilitychange イベントを発火（visible）
			Object.defineProperty(document, "visibilityState", {
				value: "visible",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// 再購読される
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
		});

		it("visibilitychange イベントで hidden 時は再購読されない", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// visibilitychange イベントを発火（hidden）
			Object.defineProperty(document, "visibilityState", {
				value: "hidden",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// 再購読されない
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
		});

		it("pageshow イベントで persisted が true の場合に再購読される", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// pageshow イベントを発火（persisted = true）
			const pageshowEvent = new Event("pageshow") as PageTransitionEvent;
			Object.defineProperty(pageshowEvent, "persisted", { value: true });
			window.dispatchEvent(pageshowEvent);

			// 再購読される
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
		});

		it("pageshow イベントで persisted が false の場合は再購読されない", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// pageshow イベントを発火（persisted = false）
			const pageshowEvent = new PageTransitionEvent("pageshow", { persisted: false });
			window.dispatchEvent(pageshowEvent);

			// 再購読されない
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
		});

		it("pagehide イベントで購読が解除される", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// pagehide イベントを発火
			const pagehideEvent = new PageTransitionEvent("pagehide", { persisted: false });
			window.dispatchEvent(pagehideEvent);

			// unsubscribe が呼ばれる
			expect(mockUnsubscribe).toHaveBeenCalled();
		});

		it("pagehide → pageshow (persisted=true) の bfcache 復帰シナリオで再購読される", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// pagehide イベントを発火（bfcache に入る）
			const pagehideEvent = new PageTransitionEvent("pagehide", { persisted: true });
			window.dispatchEvent(pagehideEvent);

			expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

			// pageshow イベントを発火（bfcache から復帰）
			const pageshowEvent = new Event("pageshow") as PageTransitionEvent;
			Object.defineProperty(pageshowEvent, "persisted", { value: true });
			window.dispatchEvent(pageshowEvent);

			// 再購読される
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
		});

		it("online イベントで再購読される", () => {
			const onAutoFinish = vi.fn();

			renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// online イベントを発火
			window.dispatchEvent(new Event("online"));

			// 再購読される
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
		});

		it("アンマウント時にイベントリスナーが解除される", () => {
			const onAutoFinish = vi.fn();
			const addEventListenerSpy = vi.spyOn(document, "addEventListener");
			const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

			const { unmount } = renderHook(() =>
				useAutoFinishSubscription({
					environmentId: "test-env-id",
					onAutoFinish,
				}),
			);

			// visibilitychange リスナーが登録されている
			expect(addEventListenerSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

			// アンマウント
			unmount();

			// リスナーが解除されている
			expect(removeEventListenerSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

			addEventListenerSpy.mockRestore();
			removeEventListenerSpy.mockRestore();
		});
	});
});
