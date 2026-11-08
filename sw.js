"use strict";

/* Bump CACHE when the shell changes so installed copies pick up the new assets. */
const CACHE = "afterimage-v28";
const ROOT = new URL("./", self.location);
const INDEX = new URL("index.html", ROOT).href;
const SHELL = [
  "index.html",
  "styles.css",
  "game.js",
  "manifest.json",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];
const CORE = [
  "index.html",
  "game.js",
  "styles.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async (cache) => {
        const outcomes = await Promise.allSettled(
          SHELL.map((path) => cache.add(new URL(path, ROOT).href))
        );
        const missing = CORE.filter((path) => {
          const idx = SHELL.indexOf(path);
          return !outcomes[idx] || outcomes[idx].status !== "fulfilled";
        });
        if (missing.length) throw new Error(`core shell missing: ${missing.join(", ")}`);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("afterimage-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            const copyRoot = response.clone();
            caches.open(CACHE).then((cache) => {
              cache.put(INDEX, copy);
              cache.put(ROOT.href, copyRoot);
            });
            return response;
          }
          return caches.match(INDEX)
            .then((cached) => cached || caches.match(ROOT.href))
            .then((cached) => cached || response);
        })
        .catch(() => caches.match(INDEX)
          .then((cached) => cached || caches.match(ROOT.href))
          .then((cached) => cached || new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          })))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: false }).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain" }
        }));
      return cached || network;
    })
  );
});
