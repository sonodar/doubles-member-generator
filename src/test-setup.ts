import "@testing-library/jest-dom/vitest";

// テスト用のダミー VAPID 公開鍵
import.meta.env.VITE_VAPID_PUBLIC_KEY = "test-vapid-public-key-for-ci";

// Push Notification API モック（usePushSubscription の IS_PUSH_SUPPORTED 評価のため）
Object.defineProperty(window, "PushManager", {
	writable: true,
	configurable: true,
	value: class PushManager {},
});

Object.defineProperty(window.navigator, "serviceWorker", {
	writable: true,
	configurable: true,
	value: {
		getRegistration: () => Promise.resolve(undefined),
		register: () => Promise.resolve({}),
		ready: Promise.resolve({}),
	},
});

Object.defineProperty(window, "Notification", {
	writable: true,
	configurable: true,
	value: {
		permission: "default" as NotificationPermission,
		requestPermission: () => Promise.resolve("granted" as NotificationPermission),
	},
});

// matchMedia モック（Chakra UI のレスポンシブ機能に必要）
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
});

// ResizeObserver モック（Chakra UI のサイズ検知に必要）
class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
	writable: true,
	value: ResizeObserverMock,
});

// IntersectionObserver モック（Chakra UI の遅延読み込みに必要）
class IntersectionObserverMock {
	readonly root: Element | null = null;
	readonly rootMargin: string = "";
	readonly thresholds: ReadonlyArray<number> = [];
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
}
Object.defineProperty(window, "IntersectionObserver", {
	writable: true,
	value: IntersectionObserverMock,
});
