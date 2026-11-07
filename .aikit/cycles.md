# Improvement Cycle Record

One entry per improvement cycle: area, defect, fix, before/after proof, played run, gates.
Screenshots are local-only proof binaries under `shots/afterimage/` at the AIKit root
(git-ignored; never committed). Every pair is captured with the same viewport, save state and
input sequence from the HEAD build (before) and the working-tree build (after).

## Cycle 1 — Progression and saves: daily streak integrity

- **Area**: progression and saves (covered: progression/saves).
- **Defect (reproduced)**: with `afterimage.daily = {last: 2026-11-06, streak: 3}`, playing
  Daily #311 and losing all three lives wrote `{last: 2026-11-07, streak: 4}` and the menu
  advertised `4-DAY STREAK · ROLLING`. A free loss minted streak progress, contradicting the
  README ("a streak that grows each day you finish one").
- **Files**: `game.js` (pure `dailyStreakAfter`; `recordDaily` wiring; `at risk` menu/result
  copy), `tests/harness.js` (export), `tests/game.test.js` (failing-first test, 8 assertions),
  `README.md` (daily semantics).
- **Fix**: only a completed daily advances `last`/`streak`; a same-day replay cannot
  double-count; a gap consumes a freeze only on the winning finish; a loss keeps the prior
  completed day and marks the current streak *at risk* so a replay can save it.
- **Visual proof** (same 1440x900 viewport, same seeded board, same preset save, three wrong
  pointer clicks):
  - before: `shots/afterimage/cycle1/before-loss-menu.png` (sha256 7C79B4525DB06C30…)
    shows `4-DAY STREAK · ROLLING` after the loss.
  - after: `shots/afterimage/cycle1/after-loss-menu.png` (sha256 FEF4EBE2C7C6C74B…)
    shows `3-DAY STREAK · ROLLING · AT RISK`.
  - result copy pair: `before-loss-result.png` / `after-loss-result.png` (the after build adds
    "Your 3-day streak is at risk — clear today's board to keep it.").
- **Played run (scripted pointer input, daily #311)**: three real clicks on wrong tiles →
  `DAILY #311 · RUN OVER`, score 0, `daily.streak` stays 3. Replay of the same seeded daily →
  ten real clicks on the odd tiles → `DAILY #311 · COMPLETE`, 5,580 points, 10/10, 100%,
  EAGLE EYE, `daily.streak` 4. Full log: `shots/afterimage/cycle1/play-log.json`.
- **Gate results**: `node --test tests` 57/57 pass; `python aikit.py check afterimage` green
  (tests, mechanics, hygiene, guidelines, secrets).

## Cycle 2 — UI readability: menu status row

- **Area**: UI readability (covered: progression/saves, UI readability).
- **Defect (reproduced)**: at 1440x900 the menu `.meta` row was a single flex line; its three
  children each wrapped (24/32/32px tall) and read `EYE LV 1 · 0 clears · 1 runs`. The menu's
  first impression was cramped and ungrammatical.
- **Files**: `styles.css` (two-band grid, mobile stack), `game.js` (pure `profileLine`),
  `tests/harness.js` (export), `tests/game.test.js` (failing-first pluralization test).
- **Fix**: the privacy note spans the first band; Eye LV and streak share the second band,
  right-aligned streak; below 500px the best labels stack left-aligned. `profileLine` guards
  non-numeric input and pluralizes clear/run.
- **Visual proof** (same 1440x900 viewport, same preset save, same date):
  - before: `shots/afterimage/cycle2/before-menu-meta.png` (sha256 ACBC7DE5F06009D9…)
    shows three two-line labels packed into one row.
  - after: `shots/afterimage/cycle2/after-menu-meta.png` (sha256 A1FADBE51ECF796B…)
    shows two bands: privacy note over `EYE LV 1 · 0 clears · 1 run` / `3-DAY STREAK · ROLLING · AT RISK`.
  - mobile check at 390x844: `after-390-menu-meta.png` (three clean left-aligned lines, no wrapping).
- **Played run (real pointer input, Zen)**: started Zen from the menu, cleared 10/10 boards,
  100%, 4,210 points; result screen `Zen complete.`; Change mode returned to the menu with
  `EYE LV 2 · 10 clears · 1 run`, `CLEARED` on the Zen tile and `DAY ONE` chapter. Full log:
  `shots/afterimage/cycle2/play.json`.
- **Gate results**: `node --test tests` 58/58 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 3 — Graphics and effects: correct-pick payoff

- **Area**: graphics and effects (covered: progression/saves, UI readability, graphics/effects).
- **Defect (reproduced)**: a correct pick paid only in the top HUD. On a rotate board the burst
  used `oddColor`, identical to every pill, so the 120ms frame showed purple/white specks and no
  local score; the player had to look away from the tile to see the gain.
- **Files**: `game.js` (pure `sparkColor`/`scorePopText`; transient `state.pops`; canvas pop
  painting/update), `tests/harness.js` (exports), `tests/game.test.js` (failing-first test),
  `README.md` (local payoff bullet).
- **Fix**: shape boards burst in accent teal (`#4fd1c5`) while color boards keep the odd color;
  every correct pick spawns a gold `+points` pop at the tile with a dark offset for contrast,
  cleared on board change and suppressed under reduced motion.
- **Visual proof** (same 1440x900 viewport, same seeded Daily #311, rotate board 5, frozen at
  120ms after the correct click):
  - before: `shots/afterimage/cycle3/before-rotate-burst.png` (sha256 45A56AE7E10C0180…)
    shows only purple/white specks and no local score.
  - after: `shots/afterimage/cycle3/after-rotate-burst.png` (sha256 97FBFDC5671AAEB5…)
    shows teal/white sparks and a gold `+500` at the tile. Full-page pair:
    `before-rotate-burst-full.png` / `after-rotate-burst-full.png`.
- **Played run (scripted pointer input, Daily #311)**: ten correct clicks produced one pop per
  board with the exact gain (+270, +330, +350, +660, +500, +600, +600, +930, +650, +690);
  rotate and size boards listed `#4fd1c5` sparks; final `Daily cleared.`, 5,580, 10/10, 100%,
  EAGLE EYE, zero console errors. Full log: `shots/afterimage/cycle3/played-daily.json`.
- **Gate results**: `node --test tests` 59/59 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 4 — Responsive layout: phone play HUD

- **Area**: responsive layout / UI readability (covered: progression/saves, UI readability,
  graphics/effects, responsive layout).
- **Defect (reproduced)**: at 390x844 the play screen measured `scrollWidth` 449 against
  `innerWidth` 390. The topbar never wrapped, so the SOUND button was pushed offscreen and the
  streak HUD was clipped at the right edge.
- **Files**: `styles.css` (640px topbar/HUD wrap), `tests/web-shell.test.js` (failing-first CSS
  contract), `sw.js` + `tests/pwa.test.js` (cache v8 for the changed shell assets), `README.md`
  (phone topbar note).
- **Fix**: below 640px the brand and sound share the first topbar row, the five HUD values take
  a full second row, lives are pushed right, and the sound control stays on the brand row.
- **Visual proof** (same 390x844 viewport, same clean Focus start):
  - before: `shots/afterimage/cycle4/before-focus-390.png` (sha256 6F5353BEF2CA9700…) shows
    the clipped streak and offscreen SOUND control; `scrollWidth` 449.
  - after: `shots/afterimage/cycle4/after-focus-390.png` (sha256 6D0E91B177A8545A…) shows both
    rows inside the viewport; `scrollWidth` 390, HUD right edge 374, sound right edge 374.
- **Played run (real pointer input, Focus, 390x844)**: cleared board 1 (+270, level 02), then
  took a wrong pick (Focus 3→2). Active HUD read `Focus 02/10 · 270 · streak 0`, all items and
  the SOUND button inside 390px, no horizontal scroll, zero console errors. Full log:
  `shots/afterimage/cycle4/play.json`; screenshot `play-hud-active-390.png`.
- **Gate results**: `node --test tests` 60/60 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 5 — Levels: persistent SURGE presentation

- **Area**: levels / level presentation (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels).
- **Defect (reproduced)**: SURGE 1.5× existed only in the opening status line. On Daily board 4
  a wrong pick replaced it with `Not that one · 2 focus left`; the board still paid 1.5× but
  nothing on screen said so.
- **Files**: `index.html` (badge node), `styles.css` (gold stage badge), `game.js` (ui lookup
  and show/hide paths), `tests/web-shell.test.js` (failing-first contract), `sw.js` +
  `tests/pwa.test.js` (cache v9), `README.md` (surge bullet).
- **Fix**: an aria-hidden `SURGE · 1.5×` pill sits in the stage's top-left padding for the whole
  surge board, is hidden for normal boards, and is cleared on start/finish/menu.
- **Visual proof** (same 1440x900 viewport, same seeded Daily #311, same wrong pick on board 4):
  - before: `shots/afterimage/cycle5/before-surge-board.png` (sha256 6B0A03BB9FA8148C…) has
    no surge marker after the miss.
  - after: `shots/afterimage/cycle5/after-surge-board.png` (sha256 ABD10F3AFFB20695…) keeps
    the gold `SURGE · 1.5×` badge visible above the board.
- **Played run (scripted pointer input, Daily #311)**: badge visible exactly on boards 4 and 8
  (`sat` and `hue`, both `surge: true`), hidden on all eight normal boards and after the run;
  final `Daily cleared.`, 5,580, 10/10, 100%, zero console errors. Full log:
  `shots/afterimage/cycle5/play.json`.
- **Gate results**: `node --test tests` 61/61 pass; `python aikit.py check afterimage` 5/5 pass.
