"use strict";

/* Bump CACHE when the shell changes so installed copies pick up the new assets. */
const CACHE = "afterimage-v3";
const ROOT = new URL("./", self.location);
const INDEX = new URL("index.html", ROOT).href;
const SHELL = [
  "",
  "index.html",
  "styles.css",
  "game.js",
  "manifest.json",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
].map((path) => new URL(path, ROOT).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
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
            caches.open(CACHE).then((cache) => cache.put(INDEX, copy));
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
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || new Response("", { status: 504 }));
      return cached || network;
    })
  );
});
