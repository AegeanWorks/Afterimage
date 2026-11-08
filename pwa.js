"use strict";

/* Standalone install support. Kept in its own file so a hosted build can omit
   the worker without touching game.js; see live/pwa.js. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* the game runs fine without offline support */
    });
  });
}
