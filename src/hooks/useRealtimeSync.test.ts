import type { Event } from "@api";
import { EventType } from "@api";
import type { CurrentSettings, GameMembers } from "@logic";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRealtimeSync } from "./useRealtimeSync";

// API のモック
vi.mock("@api", async () => {
	const actual = await vi.importActual<typeof import("@api")>("@api");
	return {
		...actual,
		subscribeEvent: vi.fn(),
		findAllEvents: vi.fn(),
	};
});

import { findAllEvents, subscribeEvent } from "@api";

const mockSubscribeEvent = vi.mocked(subscribeEvent);
const mockFindAllEvents = vi.mocked(findAllEvents);

// テスト用のモック CurrentSettings
const createMockSettings = (): CurrentSettings => ({
	courtCount: 2,
	members: [],
	histories: [],
	gameCounts: {},
	algorithm: "discreteness",
});

// テスト用のモック GameMembers
const createMockGameMembers = (): GameMembers => [[1, 2, 3, 4]];

describe("useRealtimeSync", () => {
	let mockUnsubscribe: () => void;

	beforeEach(() => {
		vi.clearAllMocks();
		mockUnsubscribe = vi.fn();
		mockSubscribeEvent.mockReturnValue({ unsubscribe: mockUnsubscribe });
		mockFindAllEvents.mockResolvedValue([]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Task 1.1: フックの基本構造とインターフェース", () => {
		it("sharedId, onEvent, onSync を受け取りフックを初期化できる", () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			const { result } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// sync 関数が返却される
			expect(result.current.sync).toBeDefined();
			expect(typeof result.current.sync).toBe("function");
		});

		it("マウント時に sync が自動実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// マウント時に sync が実行され、subscribeEvent と findAllEvents が呼ばれる
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledWith("test-shared-id", expect.any(Function));
				expect(mockFindAllEvents).toHaveBeenCalledWith("test-shared-id");
			});
		});

		it("アンマウント時に cleanup が実行され subscription が解除される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			const { unmount } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// sync 完了を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

			// アンマウント
			unmount();

			// unsubscribe が呼ばれる
			expect(mockUnsubscribe).toHaveBeenCalled();
		});
	});

	describe("Task 1.2: sync 関数の動作", () => {
		it("再実行時に既存 subscription が解除されてから新規作成される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();
			const unsubscribe1 = vi.fn();
			const unsubscribe2 = vi.fn();

			mockSubscribeEvent
				.mockReturnValueOnce({ unsubscribe: unsubscribe1 })
				.mockReturnValueOnce({ unsubscribe: unsubscribe2 });

			const { result } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync 完了を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// 手動で sync を再実行
			await act(async () => {
				await result.current.sync();
			});

			// 最初の subscription が解除される
			expect(unsubscribe1).toHaveBeenCalled();
			// 新しい subscription が作成される
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
		});

		it("API fetch 後に onSync コールバックが呼ばれる", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();
			const mockEvents: Event[] = [
				{
					id: "event-1",
					type: EventType.Initialize,
					payload: createMockSettings(),
					occurredAt: new Date(),
				},
			];
			mockFindAllEvents.mockResolvedValue(mockEvents);

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			await waitFor(() => {
				expect(onSync).toHaveBeenCalledWith(mockEvents);
			});
		});

		it("singleflight で同時呼び出しが1回のみ実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			// findAllEvents を遅延させる
			let resolveEvents: (value: Event[]) => void;
			mockFindAllEvents.mockImplementation(() => {
				return new Promise<Event[]>((resolve) => {
					resolveEvents = resolve;
				});
			});

			const { result } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 同時に複数回 sync を呼び出す
			const promise1 = result.current.sync();
			const promise2 = result.current.sync();
			const promise3 = result.current.sync();

			// 全て同じ Promise を返す（singleflight）
			expect(promise1).toBe(promise2);
			expect(promise2).toBe(promise3);

			// subscribeEvent は1回のみ呼ばれる
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);

			// Promise を解決
			resolveEvents!([]);
			await promise1;
		});

		it("エラー時に Promise 参照がクリアされる", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();
			const error = new Error("API Error");

			mockFindAllEvents.mockRejectedValueOnce(error).mockResolvedValue([]);

			const { result } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync はエラー
			await waitFor(() => {
				expect(mockFindAllEvents).toHaveBeenCalledTimes(1);
			});

			// 再度 sync を呼び出せる（Promise がクリアされている）
			await act(async () => {
				await result.current.sync();
			});

			// 2回目の呼び出しが実行される
			expect(mockFindAllEvents).toHaveBeenCalledTimes(2);
		});

		it("subscription からイベントを受信すると onEvent コールバックが呼ばれる", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();
			let eventHandler: (event: Event) => void;

			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: vi.fn() };
			});

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

			// イベントを発火
			const event: Event = {
				id: "event-2",
				type: EventType.Generate,
				payload: { members: createMockGameMembers() },
				occurredAt: new Date(),
			};
			act(() => {
				eventHandler!(event);
			});

			expect(onEvent).toHaveBeenCalledWith(event);
		});

		it("処理済みイベントは無視される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();
			let eventHandler: (event: Event) => void;

			mockSubscribeEvent.mockImplementation((_id, handler) => {
				eventHandler = handler;
				return { unsubscribe: vi.fn() };
			});

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

			const event: Event = {
				id: "event-3",
				type: EventType.Generate,
				payload: { members: createMockGameMembers() },
				occurredAt: new Date(),
			};

			// 同じイベントを2回発火
			act(() => {
				eventHandler!(event);
				eventHandler!(event);
			});

			// 1回のみ呼ばれる
			expect(onEvent).toHaveBeenCalledTimes(1);
		});
	});

	describe("Task 1.3: cleanup 関数の動作", () => {
		it("アンマウント後の sync 完了が無視される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			let resolveEvents: (value: Event[]) => void;
			mockFindAllEvents.mockImplementation(() => {
				return new Promise<Event[]>((resolve) => {
					resolveEvents = resolve;
				});
			});

			const { unmount } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// sync 開始を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

			// アンマウント（cleanup が実行される）
			unmount();

			// その後 findAllEvents が解決される
			const mockEvents: Event[] = [
				{
					id: "event-1",
					type: EventType.Initialize,
					payload: createMockSettings(),
					occurredAt: new Date(),
				},
			];
			resolveEvents!(mockEvents);

			// 少し待つ
			await new Promise((resolve) => setTimeout(resolve, 10));

			// onSync は呼ばれない（アンマウント済みなので）
			expect(onSync).not.toHaveBeenCalled();
		});

		it("cleanup 時に singleflight の Promise 参照がクリアされる", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			let resolveEvents: (value: Event[]) => void;
			mockFindAllEvents.mockImplementation(() => {
				return new Promise<Event[]>((resolve) => {
					resolveEvents = resolve;
				});
			});

			const { unmount } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// sync 開始を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

			// アンマウント
			unmount();

			// Promise を解決
			resolveEvents!([]);
		});
	});

	describe("Task 1.4: ブラウザライフサイクルイベントリスナー", () => {
		it("visibilitychange イベントで visible 時に sync が実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// visibilitychange イベントを発火（visible）
			Object.defineProperty(document, "visibilityState", {
				value: "visible",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// sync が再実行される
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
			});
		});

		it("visibilitychange イベントで hidden 時は sync が実行されない", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// visibilitychange イベントを発火（hidden）
			Object.defineProperty(document, "visibilityState", {
				value: "hidden",
				writable: true,
			});
			document.dispatchEvent(new Event("visibilitychange"));

			// 少し待つ
			await new Promise((resolve) => setTimeout(resolve, 10));

			// sync は再実行されない
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
		});

		it("pageshow イベントで persisted が true の場合に sync が実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// pageshow イベントを発火（persisted = true）
			// jsdom では PageTransitionEvent が正しく persisted を設定しないため、カスタムイベントを使用
			const pageshowEvent = new Event("pageshow") as PageTransitionEvent;
			Object.defineProperty(pageshowEvent, "persisted", { value: true });
			window.dispatchEvent(pageshowEvent);

			// sync が再実行される
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
			});
		});

		it("pageshow イベントで persisted が false の場合は sync が実行されない", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// pageshow イベントを発火（persisted = false）
			const pageshowEvent = new PageTransitionEvent("pageshow", { persisted: false });
			window.dispatchEvent(pageshowEvent);

			// 少し待つ
			await new Promise((resolve) => setTimeout(resolve, 10));

			// sync は再実行されない
			expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
		});

		it("pagehide イベントで cleanup が実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

			// pagehide イベントを発火
			const pagehideEvent = new PageTransitionEvent("pagehide", { persisted: false });
			window.dispatchEvent(pagehideEvent);

			// unsubscribe が呼ばれる
			expect(mockUnsubscribe).toHaveBeenCalled();
		});

		it("pagehide → pageshow (persisted=true) の bfcache 復帰シナリオで sync が正常に実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// pagehide イベントを発火（bfcache に入る）
			const pagehideEvent = new PageTransitionEvent("pagehide", { persisted: true });
			window.dispatchEvent(pagehideEvent);

			// unsubscribe が呼ばれる
			expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

			// pageshow イベントを発火（bfcache から復帰）
			const pageshowEvent = new Event("pageshow") as PageTransitionEvent;
			Object.defineProperty(pageshowEvent, "persisted", { value: true });
			window.dispatchEvent(pageshowEvent);

			// sync が再実行される（これが今回の修正のポイント）
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
			});
		});

		it("online イベントで sync が実行される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();

			renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(1);
			});

			// online イベントを発火
			window.dispatchEvent(new Event("online"));

			// sync が再実行される
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalledTimes(2);
			});
		});

		it("アンマウント時にイベントリスナーが解除される", async () => {
			const onEvent = vi.fn();
			const onSync = vi.fn();
			const addEventListenerSpy = vi.spyOn(document, "addEventListener");
			const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

			const { unmount } = renderHook(() =>
				useRealtimeSync({
					sharedId: "test-shared-id",
					onEvent,
					onSync,
				}),
			);

			// 初回 sync を待つ
			await waitFor(() => {
				expect(mockSubscribeEvent).toHaveBeenCalled();
			});

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
