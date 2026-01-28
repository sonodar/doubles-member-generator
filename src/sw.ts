/// <reference lib="webworker" />

import type { PushPayload } from "./api/types";

declare const self: ServiceWorkerGlobalScope;

function isServiceWorkerScope(value: unknown): value is ServiceWorkerGlobalScope {
	return typeof value === "object" && value !== null && "clients" in value && "registration" in value;
}

function registerServiceWorkerListeners(sw: ServiceWorkerGlobalScope) {
	sw.addEventListener("install", (event) => event.waitUntil(sw.skipWaiting()));
	sw.addEventListener("activate", (event) => event.waitUntil(sw.clients.claim()));

	sw.addEventListener("push", (event) => {
		let payload: PushPayload | undefined;
		try {
			payload = event.data?.json() as PushPayload | undefined;
		} catch {}

		if (!payload) return;

		const { title, ...notification } = payload;
		event.waitUntil(sw.registration.showNotification(title, notification));
	});

	const base = sw.location.origin;

	function normalizeUrl(url: string) {
		const urlObj = new URL(url, base);
		return `${urlObj.origin}${urlObj.pathname}`;
	}

	sw.addEventListener("notificationclick", (event) => {
		event.notification.close();

		if (!event.notification.data?.url) {
			return;
		}

		const shareUrl = normalizeUrl(event.notification.data.url);

		const windowPromise = sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
			const opened = clientList.find((client) => normalizeUrl(client.url) === shareUrl && "focus" in client);
			return opened ? opened.focus() : sw.clients.openWindow(shareUrl);
		});

		event.waitUntil(windowPromise);
	});
}

if (typeof self !== "undefined" && isServiceWorkerScope(self)) {
	registerServiceWorkerListeners(self);
}
