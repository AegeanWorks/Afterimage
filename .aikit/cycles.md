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
