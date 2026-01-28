import { useCallback, useMemo, useState } from "react";
import { createPushSubscription } from "../api";
import { usePushSubscriptionState } from "../components/state/atoms";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

if (!VAPID_PUBLIC_KEY) {
	throw new Error("環境変数 VAPID_PUBLIC_KEY が設定されていません");
}

export interface UsePushSubscriptionOptions {
	environmentId: string;
	onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export interface UsePushSubscriptionResult {
	status: PushSubscriptionStatus;
	isSubscribing: boolean;
	subscribe: () => Promise<void>;
}

export type PushSubscriptionStatus =
	| "unsupported" // ブラウザが PUSH 通知をサポートしていない
	| "permission-needed" // PUSH 通知の許可ダイアログを出す前の状態
	| "ready" // PUSH 通知の許可は降りているけど、購読前の状態（localStorageクリアで購読状態が消えた場合など）
	| "subscribed" // 購読完了（正常終了）
	| "denied" // PUSH 通知が拒否された
	| "registration-failed"; // Service Worker 登録処理失敗 (privateモードなど)

function checkPushSupport() {
	return (
		typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
	);
}

// Service Worker を登録する
// 開発環境では既存の登録をクリアしてから登録する（他プロジェクトの SW が残る問題を回避）
// 本番環境では既に登録済みの場合は登録処理はせずに登録済みのものを返す
async function registerServiceWorker() {
	const scope = "/"; // sw.js が直下にある前提

	// 開発環境では他プロジェクトの古い SW が残っている可能性があるためクリア
	if (import.meta.env.DEV) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(registrations.map((r) => r.unregister()));
	}

	let registration = await navigator.serviceWorker.getRegistration(scope);
	if (!registration) {
		registration = await navigator.serviceWorker.register("/sw.js", { scope });
	}
	await navigator.serviceWorker.ready;
	return registration;
}

// Uint8Array.fromBase64 がない場合の救済措置
function base64urlToBuffer(base64url: string): Uint8Array<ArrayBuffer> {
	if ("fromBase64" in Uint8Array) {
		// biome-ignore lint/suspicious/noExplicitAny: ここでの any は許容
		return (Uint8Array as any).fromBase64(base64url, { alphabet: "base64url" });
	}
	const padded = base64url.replace(/-/g, "+").replace(/_/g, "/");
	const base64 = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "=");
	const raw = atob(base64);
	return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// 購読開始
// ただし、既存の購読がある場合はそれを返す
async function getSubscription(registration: ServiceWorkerRegistration) {
	let subscription = await registration.pushManager.getSubscription();

	if (!subscription) {
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			// applicationServerKey は API 上では string を受け付けるようになっているが、
			// 実機上では string を受け付けないこともあるらしい（GPTが言ってた、知らんけど）ので、安全のため Uint8Array に変換
			applicationServerKey: base64urlToBuffer(VAPID_PUBLIC_KEY),
		});
	}

	const p256dh = subscription.getKey("p256dh");
	const auth = subscription.getKey("auth");

	// 正常な VAPID なら null になることはないのでここは throw で問題ない
	if (!p256dh || !auth) {
		throw new Error("Failed to get subscription keys");
	}

	return {
		endpoint: subscription.endpoint,
		p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
		auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
	};
}

export function usePushSubscription(options: UsePushSubscriptionOptions): UsePushSubscriptionResult {
	const { environmentId, onSubscriptionChange } = options;

	// ブラウザがサポートしていなければそもそも実行できない
	const isSupported = checkPushSupport();

	const [permissionState, setPermissionState] = useState<NotificationPermission>(() =>
		isSupported ? Notification.permission : "default",
	);

	// 購読完了しているかどうか
	// 購読処理が正常終了したら、enviromentID ごとに localStorage に永続化される
	const [isSubscribed, setIsSubscribed] = usePushSubscriptionState(environmentId);

	// Service Worker 登録失敗フラグ (Privateモードなどで起きうる)
	// 回復不可能なので、これが true の場合は早期リターン
	const [registrationFailed, setRegistrationFailed] = useState(false);

	const status = useMemo(() => {
		if (!isSupported) return "unsupported";
		if (permissionState === "denied") return "denied";
		if (registrationFailed) return "registration-failed";
		if (isSubscribed) return "subscribed";
		if (permissionState === "granted") return "ready";
		return "permission-needed";
	}, [isSupported, permissionState, registrationFailed, isSubscribed]);

	const [isSubscribing, setIsSubscribing] = useState(false);

	// 以下の状態は購読処理をする必要がないので早期リターン
	const isNotToSubscribe = useMemo(
		() => !isSupported || permissionState === "denied" || isSubscribing || isSubscribed || registrationFailed,
		[isSupported, permissionState, isSubscribing, isSubscribed, registrationFailed],
	);

	const subscribe = useCallback(async () => {
		if (isNotToSubscribe) return;
		setIsSubscribing(true); // 処理開始 ON

		try {
			// PUSH 通知の許可をもらうダイアログ表示をブラウザに指示
			const permission = await Notification.requestPermission();
			setPermissionState(permission);

			// 許可されなかったら購読しない
			if (permission !== "granted") {
				return;
			}

			let registration: ServiceWorkerRegistration;
			try {
				registration = await registerServiceWorker();
			} catch {
				setRegistrationFailed(true);
				return;
			}

			const subscription = await getSubscription(registration);

			await createPushSubscription({
				...subscription,
				environmentID: environmentId,
			});

			setIsSubscribed(true);
			onSubscriptionChange?.(true);
		} catch (error) {
			console.error("Failed to subscribe to push notifications:", error);
		} finally {
			setIsSubscribing(false); // 処理中フラグは finally で必ず OFF
		}
	}, [isNotToSubscribe, environmentId, onSubscriptionChange, setIsSubscribed]);

	return { status, isSubscribing, subscribe };
}
