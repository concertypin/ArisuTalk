/**
 * ArisuTalk Service Worker
 * Cache-first for static assets, network-first for everything else.
 * @fileoverview Minimal PWA service worker.
 */

const CACHE_NAME = "arisutalk-v1";
const STATIC_EXTENSIONS = [
    ".html",
    ".css",
    ".js",
    ".json",
    ".png",
    ".svg",
    ".ico",
    ".woff2",
];

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
            );
        })(),
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.origin === self.location.origin) {
        const ext = url.pathname.match(/\.(\w+)$/)?.[1];
        if (ext && STATIC_EXTENSIONS.includes("." + ext)) {
            event.respondWith(
                (async () => {
                    const cached = await caches.match(event.request);
                    if (cached) return cached;
                    const response = await fetch(event.request);
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, response.clone());
                    return response;
                })(),
            );
            return;
        }
    }
    event.respondWith(
        (async () => {
            try {
                return await fetch(event.request);
            } catch {
                const cached = await caches.match(event.request);
                return cached ?? new Response("Offline", { status: 503 });
            }
        })(),
    );
});
