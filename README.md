# Afterimage

<!-- aegean:media:start -->
<p align="center"><img src="assets/social-preview.svg" alt="Afterimage social preview" width="100%"></p>
<p align="center"><a href="LICENSE"><img src="https://img.shields.io/badge/license-AGL--1.1-7048e8" alt="License"></a> <a href="https://github.com/AegeanWorks/AIKit"><img src="https://img.shields.io/badge/AIKit-integrated-6f42c1" alt="AIKit Integrated"></a></p>
<!-- aegean:media:end -->

A visual perception gauntlet with a daily challenge: one tile in every grid is a shade, a size, or an angle off. Installable, offline-capable PWA.

## ⚡ 30-Second Cold-Start Quick Reference

- **Runtime Prerequisites**: Node.js 20 or newer for test runner and tools; modern browser with HTML5 Canvas and WebAudio for playing.
- **Canonical Regression Shield Gate**:
  ```bash
  node --test tests
  ```

### 🛠️ AIKit Commands (run from the AIKit folder)
| Role | Command |
|---|---|
| Status, task and gates | `python aikit.py status afterimage` |
| Phase 4: every gate | `python aikit.py check afterimage` |
| Repair memory and map, then check | `python aikit.py fix afterimage` |
| Resume an interrupted task | `python aikit.py resume afterimage` |

## Play

No dependencies and no build step. From this folder:

```bash
python -m http.server 8139
```

Open <http://127.0.0.1:8139/>. On Windows, double-click `PLAY.bat`.

Deep links: `/?mode=daily`, `/?mode=focus`, `/?mode=blitz`, `/?mode=zen`, `/?mode=nightmare`.

## Install & offline

Afterimage is a PWA. Served from `localhost` (a secure context), Chromium and Edge offer **Install app**; installed, it runs standalone with no browser chrome. A service worker caches the shell on the first visit, so the game keeps working offline — including today's seeded daily.

Open the page once to install the worker, reload once to be controlled, then use the browser's install action. Service workers require `localhost` or HTTPS; for a phone, serve the folder over HTTPS (or a tunnel) rather than a plain LAN IP.

The cache name lives in `sw.js`; bump `CACHE` whenever a cached asset changes.

## Daily challenge

The card at the top is seeded by your local date: **the same ten boards all day**, a three-life clock run, and a streak that grows each day you finish one. The menu keeps your best score for today; replays are allowed but only improve the day's best. Two fresh starts produce identical pixels — the seed is a small mulberry32 PRNG hashed from `YYYY-MM-DD`.

## Modes

| Mode | Boards | Pressure |
| --- | --- | --- |
| Focus run | 10 | clock, three lives |
| Blitz | 10 | half clock, two lives, 1.5× score |
| Zen | 10 | no clock, no fail |
| Nightmare | 8 | up to 10×10, one life, 2× score |

Every board hides one tile that differs by **hue, lightness, saturation, size or angle**. Focus, Blitz and Nightmare keep a personal best in `localStorage`; Zen has no clock, so it keeps none. A perfect run earns **EAGLE EYE**, **QUICK EYE** or **NIGHT VISION** depending on the mode.

`Tab` and the arrow keys move between tiles, `Enter` picks one. `Quit run` leaves any mode; `Skip level` appears in Zen.

![Nightmare mode](assets/nightmare.png)

## Score card

Every result can be saved as a **1200 × 630 PNG**, drawn on a second canvas: score, rating, stats and a mini board. Daily cards add the date and their daily number.

![Score card](assets/card.png)

## Share the result

The result screen logs every board and shows the pattern as colored squares:

- 🟩 first-try clear
- 🟨 clear after a wrong click
- 🟥 timeout
- ⬜ skipped in Zen
- ⬛ untouched

**Copy result** writes the same pattern as text, ready to paste. A perfect daily would copy as:

```text
Afterimage Daily #304 · EAGLE EYE
2,300 · 10/10 · 100%
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
Find the tile that doesn't belong.
```

## Why it exists

Afterimage doubles as a **testbed for multimodal agents**. The answer is never written into the DOM: the grid is painted on a canvas, and the only interactive elements are transparent hit areas labelled `Row N, column M`. To play, an agent has to read the rendered pixels and click the tile it believes is different.

I played a full Zen run this way, exporting the board after every round:

> **10/10 cleared · 100% accuracy · 2,300 points · EAGLE EYE**

The run caught two real bugs that the screenshots made obvious: burst particles leaking into the next board, and an empty "FOCUS" label in Zen. The daily seed is verified the same way: two independent starts hash to the same canvas. A later test of the wrong-click paths caught a missing `shake()` in the engine rewrite; recovery and fatal-miss results are now covered end to end.

## Under the hood

- Vanilla HTML, CSS and JavaScript. One render canvas, one favicon, no game assets.
- Four mode configs plus the daily challenge drive two level scripts; Nightmare's script runs from 8×8 to 10×10.
- `game.js` holds the palette generator, seeded PRNG, DPR-aware renderer, hit-testing, scoring and WebAudio blips.
- Daily puzzles use mulberry32 seeded from the local date; the daily result and streak live under `afterimage.daily`.
- Each board logs green/gold/red/skip/dark for the result strip and copied text; the clipboard uses the async API with a textarea fallback.
- A service worker caches the shell; navigations are network-first with a cached-index fallback on failure **or non-OK responses**, assets are cache-first with a background refresh.
- The manifest adds standalone display, maskable icons and Daily/Nightmare shortcuts.
- Per-mode bests are stored as JSON, with the old single best migrated.
- A run token (`runId`) guards late `setTimeout` callbacks after quitting; particles are cleared between boards.
- Respects `prefers-reduced-motion`; storage and audio failures are non-fatal.

## 📦 What's Inside

```text
afterimage/
├── .gitignore                <- transient AIKit state excluded
├── ASSETS.md                 <- Asset/data manifest: what the license covers
├── COMMERCIAL.md             <- Commercial licensing terms
├── LICENSE                   <- Aegean Game License 1.1 (AGL-1.1): DRM-free personal play
├── LICENSES/                 <- REUSE license texts
├── package.json              <- project metadata and test runner scripts
├── PLAY.bat                  <- Windows launcher
├── README.md
├── REUSE.toml                <- Machine-readable SPDX metadata
├── assets/                   <- screenshots, icons, and media artwork
├── favicon.svg               <- vector browser tab favicon
├── game.js                   <- game engine, PRNG, renderer and mechanics
├── icons/                    <- PWA application icons
├── index.html                <- game markup, HUD and modal templates
├── manifest.json             <- Web App Manifest for PWA installation
├── styles.css                <- responsive styling and layout
├── sw.js                     <- service worker for offline shell caching
├── tests/                    <- automated behavioral and regression tests
├── tools/                    <- icon generation scripts
└── .aikit/                   <- this project's memory: record, ledger, decisions
```

## 🧪 Tests

```bash
node --test tests
```

`tests/harness.js` stubs the browser environment (DOM elements, canvas, ResizeObserver, localStorage) and loads `game.js` inside `node:vm` without opening network ports. `tests/game.test.js` covers PRNG determinism, daily date hashing, scripts and modes configuration, board round generation with odd-tile verification, score calculation, performance ratings, and share card formatting.

<!-- aegean:brand-assets:start -->
## 🎨 Brand Assets

> **AI-Generated Brand Artwork.** The banner and logo are **AI-generated brand assets**. They are illustrative and may not literally depict every feature or the full project scope.
<!-- aegean:brand-assets:end -->

## 📜 License

<!-- aegean:license:start -->
Free for personal play under the Aegean Game License 1.1 (AGL-1.1); see [LICENSE](LICENSE). It is DRM-free: Licensor ships no DRM and a distributor may not add it. Streaming, modding and free mods are allowed. Commercial use, paid mods and AI training need the Aegean Commercial License 1.0 (ACL-1.0); see [COMMERCIAL.md](COMMERCIAL.md).
<!-- aegean:license:end -->
