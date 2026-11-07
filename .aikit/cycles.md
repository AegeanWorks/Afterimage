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
