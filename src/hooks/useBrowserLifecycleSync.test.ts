import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { useBrowserLifecycleSync } from "./useBrowserLifecycleSync";

describe("useBrowserLifecycleSync", () => {
	let onResume: Mock<() => void>;
	let onPause: Mock<() => void>;

	beforeEach(() => {
		vi.clearAllMocks();
		onResume = vi.fn<() => void>();
		onPause = vi.fn<() => void>();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("基本動作", () => {
		it("マウント時に onResume/onPause は呼ばれない", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			expect(onResume).not.toHaveBeenCalled();
			expect(onPause).not.toHaveBeenCalled();
		});

		it("アンマウント時にイベントリスナーが解除される", () => {
			const addEventListenerSpy = vi.spyOn(document, "addEventListener");
			const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
			const windowAddEventListenerSpy = vi.spyOn(window, "addEventListener");
			const windowRemoveEventListenerSpy = vi.spyOn(window, "removeEventListener");

			const { unmount } = renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// イベントリスナーが登録されている
			expect(addEventListenerSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
			expect(windowAddEventListenerSpy).toHaveBeenCalledWith("pageshow", expect.any(Function));
			expect(windowAddEventListenerSpy).toHaveBeenCalledWith("pagehide", expect.any(Function));
			expect(windowAddEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));

			// アンマウント
			unmount();

			// リスナーが解除されている
			expect(removeEventListenerSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
			expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith("pageshow", expect.any(Function));
			expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith("pagehide", expect.any(Function));
			expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));

			addEventListenerSpy.mockRestore();
			removeEventListenerSpy.mockRestore();
			windowAddEventListenerSpy.mockRestore();
			windowRemoveEventListenerSpy.mockRestore();
		});
	});

	describe("visibilitychange イベント", () => {
		it("visible 時に onResume が呼ばれる", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// visibilitychange イベントを発火（visible）
			Object.defineProperty(document, "visibilityState", {
				value: "visible",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			expect(onResume).toHaveBeenCalledTimes(1);
			expect(onPause).not.toHaveBeenCalled();
		});

		it("hidden 時は onResume が呼ばれない", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// visibilitychange イベントを発火（hidden）
			Object.defineProperty(document, "visibilityState", {
				value: "hidden",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			expect(onResume).not.toHaveBeenCalled();
			expect(onPause).not.toHaveBeenCalled();
		});
	});

	describe("pageshow イベント", () => {
		it("persisted=true の場合に onResume が呼ばれる", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// pageshow イベントを発火（persisted = true）
			const pageshowEvent = new Event("pageshow") as PageTransitionEvent;
			Object.defineProperty(pageshowEvent, "persisted", { value: true });
			window.dispatchEvent(pageshowEvent);

			expect(onResume).toHaveBeenCalledTimes(1);
			expect(onPause).not.toHaveBeenCalled();
		});

		it("persisted=false の場合は onResume が呼ばれない", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// pageshow イベントを発火（persisted = false）
			const pageshowEvent = new PageTransitionEvent("pageshow", { persisted: false });
			window.dispatchEvent(pageshowEvent);

			expect(onResume).not.toHaveBeenCalled();
			expect(onPause).not.toHaveBeenCalled();
		});
	});

	describe("pagehide イベント", () => {
		it("onPause が呼ばれる", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// pagehide イベントを発火
			const pagehideEvent = new PageTransitionEvent("pagehide", { persisted: false });
			window.dispatchEvent(pagehideEvent);

			expect(onPause).toHaveBeenCalledTimes(1);
			expect(onResume).not.toHaveBeenCalled();
		});
	});

	describe("online イベント", () => {
		it("onResume が呼ばれる", () => {
			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume,
					onPause,
				}),
			);

			// online イベントを発火
			window.dispatchEvent(new Event("online"));

			expect(onResume).toHaveBeenCalledTimes(1);
			expect(onPause).not.toHaveBeenCalled();
		});
	});

	describe("bfcache 復帰シナリオ", () => {
		it("pagehide → pageshow(persisted=true) で onPause → onResume の順に呼ばれる", () => {
			const callOrder: string[] = [];
			const trackingOnResume = vi.fn(() => callOrder.push("onResume"));
			const trackingOnPause = vi.fn(() => callOrder.push("onPause"));

			renderHook(() =>
				useBrowserLifecycleSync({
					subject: "test",
					onResume: trackingOnResume,
					onPause: trackingOnPause,
				}),
			);

			// pagehide イベントを発火（bfcache に入る）
			const pagehideEvent = new PageTransitionEvent("pagehide", { persisted: true });
			window.dispatchEvent(pagehideEvent);

			expect(trackingOnPause).toHaveBeenCalledTimes(1);

			// pageshow イベントを発火（bfcache から復帰）
			const pageshowEvent = new Event("pageshow") as PageTransitionEvent;
			Object.defineProperty(pageshowEvent, "persisted", { value: true });
			window.dispatchEvent(pageshowEvent);

			expect(trackingOnResume).toHaveBeenCalledTimes(1);
			expect(callOrder).toEqual(["onPause", "onResume"]);
		});
	});

	describe("コールバックの参照安定性", () => {
		it("コールバックが変更されても古いコールバックは呼ばれない", () => {
			const onResumeV1 = vi.fn();
			const onPauseV1 = vi.fn();
			const onResumeV2 = vi.fn();
			const onPauseV2 = vi.fn();

			const { rerender } = renderHook(
				({ onResume, onPause }) =>
					useBrowserLifecycleSync({
						subject: "test",
						onResume,
						onPause,
					}),
				{ initialProps: { onResume: onResumeV1, onPause: onPauseV1 } },
			);

			// コールバックを変更
			rerender({ onResume: onResumeV2, onPause: onPauseV2 });

			// online イベントを発火
			window.dispatchEvent(new Event("online"));

			// 新しいコールバックが呼ばれる
			expect(onResumeV2).toHaveBeenCalledTimes(1);
			expect(onResumeV1).not.toHaveBeenCalled();
		});
	});
});
