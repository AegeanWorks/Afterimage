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

## Cycle 6 — Progression and saves: corrupt daily recovery

- **Area**: progression and saves / save resilience (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience).
- **Defect (reproduced)**: a persisted `afterimage.daily.result` of `{date: today}` (valid date,
  missing score) threw `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`
  inside `renderDaily` during boot. `/?mode=daily` stayed on the menu, and the boot sequence
  never reached `startRun`.
- **Files**: `game.js` (pure `sanitizeDailyResult`, validated `loadDaily`), `tests/harness.js`
  (exports), `tests/game.test.js` (failing-first sanitizer + loader tests), `sw.js` +
  `tests/pwa.test.js` (cache v10), `README.md` (save validation note).
- **Fix**: the loader accepts only a valid date plus a finite non-negative score; totals default
  to 10, cleared is capped at total, accuracy at 100, ratings fall back to `WARMING UP`, and
  `won` is coerced. Malformed results become `null`; malformed `last` keys become empty.
- **Visual proof** (same 1440x900 viewport, same corrupt save, same `/?mode=daily` URL):
  - before: `shots/afterimage/cycle6/before-corrupt-deeplink.png` (sha256 E08B2F2DC8B412ED…)
    shows the menu; the log records the boot TypeError.
  - after: `shots/afterimage/cycle6/after-corrupt-deeplink.png` (sha256 CEA76D33336A0128…)
    shows Daily level 1; the log records `phase: play`, zero errors.
- **Played run (scripted pointer input, Daily #311, corrupt save)**: the deep link started the
  run, ten correct clicks cleared it, result `Daily cleared.` 5,570, 10/10, 100%, EAGLE EYE;
  the daily record repaired to `{last: 2026-11-07, streak: 4, result: score 5570, won: true}`
  with zero console errors. Full log: `shots/afterimage/cycle6/after-log.json`; result frame
  `recovered-result.png`.
- **Gate results**: `node --test tests` 63/63 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 7 — Combat feel: fair reveal on a fatal miss

- **Area**: combat feel / failure feedback (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback).
- **Defect (reproduced)**: a wrong pick that took the last life went to the result after 640ms
  with only `Out of focus`; unlike a timeout it never revealed the odd tile, so the player could
  not learn the answer from the loss.
- **Files**: `game.js` (pure `shouldRevealMiss`; fatal branch sets `state.reveal`, extends the
  beat to 1150ms and paints immediately), `tests/harness.js` (export), `tests/game.test.js`
  (failing-first test), `sw.js` + `tests/pwa.test.js` (cache v11), `README.md` (fair reveal).
- **Fix**: any timed fatal miss now reuses the timeout reveal overlay, dims the board, marks the
  odd tile, says `Out of focus — it was there`, and holds for 1150ms before the result. Nonfatal
  misses and Zen wrong picks keep the existing 640/400ms rhythm and no reveal.
- **Visual proof** (same 1440x900 viewport, same seeded Daily #311, third wrong pick at 180ms):
  - before: `shots/afterimage/cycle7/before-fatal-miss.png` (sha256 90D7F9BE47AD8A21…) shows
    the plain board with the wrong tile flashing and no answer marker.
  - after: `shots/afterimage/cycle7/after-fatal-miss.png` (sha256 28F4FBF1DED2E09B…) shows the
    dimmed board, the odd tile ringed, status `Out of focus — it was there`.
- **Played run (scripted pointer input, Daily #311)**: three wrong picks ended the run at
  0/10, 0%, `So close.`, one red board; `state.reveal` was true with lives 0, and the result
  carried no console errors. Full logs: `shots/afterimage/cycle7/before-log.json` /
  `after-log.json`; result frames `before-result.png` / `after-result.png`.
- **Gate results**: `node --test tests` 64/64 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 8 — Audio cues: distinct timeout, win and loss

- **Area**: audio cues (covered: progression/saves, UI readability, graphics/effects,
  responsive layout, levels, save resilience, failure feedback, audio cues).
- **Defect (reproduced)**: `timeout()` called `soundWrong()`, so a timeout and a wrong pick
  played the same single 146Hz triangle; `finish()` played nothing, so wins and losses were
  silent. The before tone log shows `wrong: [146]`, `timeout: [880 tick, 146]`, `loss: [146]`,
  `win: [890, 1308, 1510]` (correct-pick tones only).
- **Files**: `game.js` (new `soundTimeout`/`soundWin`/`soundLose`, timeout call, finish call),
  `tests/harness.js` (exports), `tests/game.test.js` (failing-first oscillator-capture test),
  `sw.js` + `tests/pwa.test.js` (cache v12), `README.md` (audio grammar).
- **Fix**: timeout is a descending 392→294→196Hz fall; win is a rising
  523.25→659.25→783.99→1046.5Hz arpeggio; loss is a low 220→164.81Hz fall. `finish` plays the
  win sting only for a run with at least one clear, otherwise the loss fall.
- **Audio proof** (real Chromium, instrumented `AudioContext`, same 1440x900 / Daily #311 setup):
  - before: `shots/afterimage/cycle8/before-log.json` — timeout 146Hz = wrong 146Hz; no finish
    sting on win.
  - after: `shots/afterimage/cycle8/after-log.json` — timeout `[880 tick, 392, 294, 196]`,
    loss `[146, 220, 164.81]`, win `[890, 1308, 1510, 523.25, 659.25, 783.99, 1046.5]`.
- **Played run**: Daily #311 wrong pick → shortened clock → timeout reveal (`Time — here it
  was`), then a fatal miss → loss result; a separate Zen run cleared 10/10, 100%, 4,210 →
  `Zen complete.` Both runs logged the expected cue contours with zero console errors; frames:
  `timeout-reveal.png`, `loss-result.png`, `win-result.png` (before/after).
- **Gate results**: `node --test tests` 65/65 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 9 — Failure debrief: remove the duplicate Zen pointer

- **Area**: failure debrief copy / UI readability (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy).
- **Defect (reproduced)**: the WARMING UP blurb ended with "Zen mode is a good place to study
  the boards", and the weakest-type sentence immediately appended "Hue boards cost you most —
  Zen is a good place to study them." The same advice appeared twice in one paragraph.
- **Files**: `game.js` (WARMING UP blurb), `tests/game.test.js` (failing-first copy test),
  `sw.js` + `tests/pwa.test.js` (cache v13).
- **Fix**: the base blurb now says "Every miss is a calibration. Start with the bright, big
  boards and work down." The weakest-type sentence remains the single, specific Zen pointer.
- **Visual proof** (same 1440x900 viewport, same three-miss Daily #311, same result state):
  - before: `shots/afterimage/cycle9/before-result.png` (sha256 7E761FAE6CFE6896…) repeats
    "Zen" twice.
  - after: `shots/afterimage/cycle9/after-result.png` (sha256 0543779353DC18ED…) reads one
    general cue plus the hue-specific Zen sentence.
- **Played run (scripted pointer input, Daily #311)**: three wrong picks, `So close.`, 0/10,
  0%, WARMING UP; both builds logged zero console errors. Result logs:
  `shots/afterimage/cycle9/before-log.json` / `after-log.json`.
- **Gate results**: `node --test tests` 66/66 pass; `python aikit.py check afterimage` 5/5 pass.

## Capture method (all cycles)

- Server: `python -m http.server 8139 --bind 127.0.0.1` from `projects/afterimage`.
  Before-build pairs were served on 8140 from a detached worktree:
  `git worktree add $env:TEMP\afterimage-head <sha>`.
- Driver: Chromium 156 (Playwright install) headless over CDP at 1440x900 (or 390x844 for
  mobile), `deviceScaleFactor 1`, fresh temporary user-data-dir, clean `localStorage`, real
  `Input.dispatchMouseEvent` clicks, `Page.captureScreenshot` (stage clips use the stage rect).
  Daily captures use the deterministic `?mode=daily` seed. Animation-frozen frames cancel the
  next `requestAnimationFrame` at the recorded moment.
- Exact probe commands (helper lives in `%TEMP%\afterimage-tools\cdp.mjs`):
  - `node "$env:TEMP\afterimage-tools\daily-loss-probe.mjs" before2 http://127.0.0.1:8140`
    and `... after` (cycle 1).
  - `node "$env:TEMP\afterimage-tools\menu-meta-probe.mjs" before` / `after` / `after390 ... 390 844`
    (cycle 2).
  - `node "$env:TEMP\afterimage-tools\burst-probe.mjs" before3 http://127.0.0.1:8140` / `after2`
    (cycle 3).
  - `node "$env:TEMP\afterimage-tools\mobile-play-probe.mjs" http://127.0.0.1:8140 "cycle4-before-"`
    / `http://127.0.0.1:8139 "cycle4-after-"` (cycle 4).
  - `node "$env:TEMP\afterimage-tools\surge-probe.mjs" before` / `after` (cycle 5).
  - `node "$env:TEMP\afterimage-tools\corrupt-save-probe.mjs" before2 http://127.0.0.1:8140` /
    `after` (cycle 6).
  - `node "$env:TEMP\afterimage-tools\fatal-reveal-probe.mjs" before` / `after` (cycles 7, 9).
  - `node "$env:TEMP\afterimage-tools\audio-probe.mjs" before http://127.0.0.1:8140` / `after`
    (cycle 8); the same probe wraps `AudioContext.createOscillator` via
    `Page.addScriptToEvaluateOnNewDocument` and records each `frequency.setValueAtTime` call.
  - `node "$env:TEMP\afterimage-tools\final-board-probe.mjs" before2 http://127.0.0.1:8140` /
    `after2` and `node "$env:TEMP\afterimage-tools\final-run.mjs"` (cycle 10).
  - `node "$env:TEMP\afterimage-tools\daily-best-probe.mjs" before` / `after` (cycle 11).
  - `node "$env:TEMP\afterimage-tools\save-card-probe.mjs" before failure|success` /
    `after failure|success` (cycle 12); the failure mode replaces `document.createElement`
    canvases with a null 2D context after the result screen opens.
  - `node "$env:TEMP\afterimage-tools\copy-result-probe.mjs" before failure|success` /
    `after failure|success` (cycle 13); the failure mode rejects
    `navigator.clipboard.writeText` and makes `document.execCommand` return false.
  - `node "$env:TEMP\afterimage-tools\menu-focus-probe.mjs" before` / `after` (cycle 14);
    real CDP `Tab` key events walk the result actions before Change mode is activated.
  - `node "$env:TEMP\afterimage-tools\result-entry-probe.mjs" before` / `after` (cycle 15);
    both a loss result and a full won replay are captured.
  - `node "$env:TEMP\afterimage-tools\offline-probe.mjs" probe` and
    `node "$env:TEMP\afterimage-tools\offline-cold-probe.mjs"` (cycle 16 offline dead end).
  - `node "$env:TEMP\afterimage-tools\wrong-focus-probe.mjs" before` / `after` (cycle 16
    in-grid focus); real CDP Enter/arrow events drive the wrong pick and recovery.
  - `node "$env:TEMP\afterimage-tools\initial-focus-probe.mjs" before
    http://127.0.0.1:8140` / `after` (cycle 17); `Emulation.setFocusEmulationEnabled` makes
    programmatic first-load focus visible as it is in a real window. The score-card overflow
    dead end used `node "$env:TEMP\afterimage-tools\score-card-probe.mjs"`.
  - `node "$env:TEMP\afterimage-tools\modal-focus-probe.mjs" before` / `after` (cycle 18);
    Shift+Tab is dispatched as a real CDP key event, then a keyboard Daily run reaches the
    result and checks the wrap.
  - `node "$env:TEMP\afterimage-tools\mode-best-probe.mjs" before` / `after` (cycle 19);
    `Page.addScriptToEvaluateOnNewDocument` fixes `Math.random` so the Blitz boards and score
    match across builds. `node "$env:TEMP\afterimage-tools\mode-loss-audit.mjs"` audits
    Blitz/Nightmare/Focus losses.
  - `node "$env:TEMP\afterimage-tools\onslaught-persistence.mjs"` (cycle 20 dead end) and
    `node "$env:TEMP\afterimage-tools\save-version-probe.mjs" before` / `after` (cycle 20);
    the latter seeds version-2 profile/bests then presses H to trigger a profile save.
  - `node "$env:TEMP\afterimage-tools\quit-run-probe.mjs" before` / `after` (cycle 21);
    clears two Focus boards, quits, then finishes a separate run to check double counting.
  - `node "$env:TEMP\afterimage-tools\blocked-best-probe.mjs" before` / `after` (cycle 22);
    seeds version-2 bests, wins a deterministic Focus run, then reloads the menu.
  - `node "$env:TEMP\afterimage-tools\blocked-daily-best.mjs" before` / `after` (cycle 23);
    seeds version-2 daily, wins the deterministic daily, then reloads the menu.
  - `node "$env:TEMP\afterimage-tools\blocked-freeze-probe.mjs" before` / `after` (cycle 24);
    seeds version-2 profile, wins the daily, then reloads. The freeze earn/consume dead end used
    `node "$env:TEMP\afterimage-tools\freeze-audit.mjs"`.
  - `node "$env:TEMP\afterimage-tools\timer-label-probe.mjs" before` / `after` (cycle 25);
    forces 12,000ms, crops the timer, advances a second, then drops a life with a wrong pick.
  - `node "$env:TEMP\afterimage-tools\lives-hud-probe.mjs" before2` / `after` (cycle 26);
    fixed HUD crop at three lives, then a wrong pick at two lives.
  - `node "$env:TEMP\afterimage-tools\hud-390-probe.mjs" before` / `after 390` (cycle 27);
    normal and stressed 390px HUD measurements. `node
    "$env:TEMP\afterimage-tools\streak-play.mjs"` plays one 390px Focus clear.
  - `node "$env:TEMP\afterimage-tools\hud-390-probe.mjs" before 390` / `after 390` and
    `after320 320` (cycle 28); the same probe measures the restored Focus label and stress fit.
  - `node "$env:TEMP\afterimage-tools\mobile-result-panels.mjs" layout 390 844` / `short 390 667`
    (cycle 29 layout dead end) and `node "$env:TEMP\afterimage-tools\inert-probe.mjs" before` /
    `after` (cycle 29 AX isolation).
  - `node "$env:TEMP\afterimage-tools\nightmare-perf.mjs" before` and
    `node "$env:TEMP\afterimage-tools\nightmare-cold.mjs"` (cycle 30 10x10 audit).`
  - `node "$env:TEMP\afterimage-tools\hidden-pause-probe.mjs" before` / `after` (cycle 31);
    hides during the 680ms post-correct pause, waits 3s, returns, then clears the run.
  - `node "$env:TEMP\afterimage-tools\decided-quit-probe.mjs" before` / `after` (cycle 32);
    a daily loss quit inside the fatal reveal, then a Zen 10/10 quit inside the final pause.
- Gate commands after every cycle: `node --test tests` from the project and
  `python aikit.py check afterimage` from the AIKit root. Results are listed per cycle above.
- The PNG/JSON proof files live under `shots/afterimage/cycleN/` at the AIKit root; that tree
  is git-ignored and the binaries are never committed.

## Cycle 10 — Boss presentation: the final board

- **Area**: enemies/bosses / final-board presentation (covered: progression/saves, UI
  readability, graphics/effects, responsive layout, levels, save resilience, failure feedback,
  audio cues, debrief copy, boss presentation).
- **Defect (reproduced)**: board 10 looked exactly like every other board. Its only cue was the
  transient status line, so the run's climax had no persistent visual identity; the before log
  shows `stageClass: "stage"` and no badge.
- **Files**: `game.js` (pure `isFinalBoard`, stage class and badge wiring), `index.html` (badge
  node), `styles.css` (gold finale border + badge), `tests/game.test.js` (failing-first pure
  test), `tests/web-shell.test.js` (shell/CSS/JS contract), `sw.js` + `tests/pwa.test.js`
  (cache v14), `README.md` (boss beat).
- **Fix**: only the last level toggles `.stage.finale` and shows an aria-hidden
  `FINAL BOARD` badge; start/finish/menu/boot clear both.
- **Visual proof** (same seeded Daily, same 1440x900 viewport, same board-10 state with score
  4,890; stage class and badge logged):
  - before: `shots/afterimage/cycle10/before-final-board.png` (sha256 33343053C8C7782C…)
    shows an ordinary stage with no marker.
  - after: `shots/afterimage/cycle10/after-final-board.png` (sha256 9AF14A2B96E6A1A7…)
    shows the gold finale border and `FINAL BOARD` badge.
- **Played run (scripted pointer input, Daily)**: all 10 boards cleared; the badge and finale
  class appeared only on board 10, were absent on boards 1–9, and both were gone on the result
  (`stage`, badge hidden). Final result `Daily cleared.`, 5,580, 10/10, 100%, zero console
  errors. Full log: `shots/afterimage/cycle10/played-daily.json`; frame `played-result.png`.
- **Gate results**: `node --test tests` 68/68 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 11 — Daily best: a loss is not a benchmark

- **Area**: result card / daily save edge case (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results).
- **Defect (reproduced)**: clearing one board then losing all three lives produced a Daily
  result of 270 with `NEW DAILY BEST` visible. The failed attempt was stored as the day's
  benchmark, so a later lower-scoring win could not replace it.
- **Files**: `game.js` (pure `dailyResultBeats`; win-first replacement; badge gated on `won`),
  `tests/harness.js` (export), `tests/game.test.js` (failing-first 8-assertion test), `sw.js` +
  `tests/pwa.test.js` (cache v15), `README.md` (daily-best semantics).
- **Fix**: a completed run always outranks a loss regardless of score; within the same
  completion status the higher score wins; `NEW DAILY BEST` is gated on `won`.
- **Visual proof** (same seeded Daily #312, same 1440x900 viewport, same one-clear-then-loss
  state, score 270):
  - before: `shots/afterimage/cycle11/before-loss-result.png` (sha256 A097FB221750C750…)
    shows `NEW DAILY BEST` on a `RUN OVER`.
  - after: `shots/afterimage/cycle11/after-loss-result.png` (sha256 996A9E31457C9E45…)
    shows the same result without the badge.
- **Played run**: loss result 270, 1/10, 25%, no badge; immediate replay cleared 10/10 at
  100% for 5,580, showed `NEW DAILY BEST`, and stored `won: true` in `afterimage.daily`.
  Both result screens are in `shots/afterimage/cycle11/` (`before-win-result.png` /
  `after-win-result.png`); logs `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 69/69 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 12 — Save card: a visible fallback for a failed export

- **Area**: result card / save/download edge case (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback).
- **Defect (reproduced)**: when `renderScoreCard` returned an empty URL (new canvas context
  unavailable), `saveScoreCard` returned without changing anything. The before log shows the
  button still `Save card`, enabled, and no status node; the result screen looked untouched.
- **Files**: `game.js` (pure `saveCardFeedback`, status writer, save-flow rewrite),
  `index.html` (`saveStatus` live region), `styles.css` (status line), `tests/game.test.js`
  (failing-first feedback test), `tests/web-shell.test.js` (live-region contract), `sw.js` +
  `tests/pwa.test.js` (cache v16), `README.md` (card failure note).
- **Fix**: failed exports now show `Card unavailable — Copy result still works.` in a
  `role="status"` line, leave the button enabled for retry, and clear the status on a new
  result/menu; successful exports show `Download requested — check your downloads.` alongside
  the `Saved` button state.
- **Visual proof** (same seeded Daily #312 loss result, same 1440x900 viewport, same mocked
  empty canvas export):
  - before: `shots/afterimage/cycle12/before-failure-save-card.png` (sha256 82A0834757F2E4E9…)
    shows no feedback at all after the click.
  - after: `shots/afterimage/cycle12/after-failure-save-card.png` (sha256 45D26BDA235F987F…)
    shows the red `Card unavailable — Copy result still works.` line.
- **Played run**: the same result-screen flow under a normal canvas export gives `Saved` and
  `Download requested — check your downloads.` with zero console errors. Evidence:
  `before-success-save-card.png` / `after-success-save-card.png` and the four JSON logs in
  `shots/afterimage/cycle12/`.
- **Gate results**: `node --test tests` 71/71 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 13 — Copy result: manual fallback when the clipboard is blocked

- **Area**: result-card sharing / clipboard fallback (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback).
- **Defect (reproduced)**: with both `navigator.clipboard.writeText` and `execCommand("copy")`
  blocked, clicking Copy result showed a disabled `Copy failed` label, exposed none of the share
  text, and left `document.activeElement` on `BODY`. The player had no way to recover.
- **Files**: `game.js` (pure `copyFeedback`, fallback panel, focus handling), `index.html`
  (panel/label/textarea/Close), `styles.css` (panel styling), `tests/game.test.js`
  (failing-first feedback test), `tests/web-shell.test.js` (panel contract), `sw.js` +
  `tests/pwa.test.js` (cache v17), `README.md` (manual copy note).
- **Fix**: blocked copies open the complete share text in a read-only textarea, selected and
  focused, under `Text selected — press Ctrl+C / Cmd+C`; Close hides it and returns focus to
  Copy result. The copy button stays enabled, and the hidden-textarea fallback now restores
  focus too.
- **Visual proof** (same seeded Daily #312 loss result, same 1440x900 viewport, same blocked
  clipboard):
  - before: `shots/afterimage/cycle13/before-failure-copy-result.png` (sha256
    6FF81836385B720B…) shows only `COPY FAILED` and no text.
  - after: `shots/afterimage/cycle13/after-failure-copy-result.png` (sha256 591B3DEAE8B66CE7…)
    shows the selected share text, the Ctrl+C/Cmd+C label and Close.
- **Played run**: the blocked flow exposed the exact `buildShareText` output
  (selection 0–95), focused `#copyText`, and Close restored focus to `#copyResult`; the normal
  clipboard flow still shows `Copied` with the panel hidden and focus on the button. Logs:
  `before-failure-log.json` / `after-failure-log.json` /
  `before-success-log.json` / `after-success-log.json`; zero console errors.
- **Gate results**: `node --test tests` 73/73 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 14 — Keyboard focus: returning to the menu

- **Area**: keyboard focus / menu return (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus).
- **Defect (reproduced)**: after a result, keyboard users tabbed to Change mode and activated
  it; the menu opened with `document.activeElement` on `BODY`, because the focused button lived
  inside the hidden result overlay. The before log also shows result-entry focus on `BODY`.
- **Files**: `game.js` (`showMenu` focuses the primary Daily action), `tests/web-shell.test.js`
  (failing-first focus contract), `sw.js` + `tests/pwa.test.js` (cache v18), `README.md`
  (keyboard return note).
- **Fix**: `showMenu` focuses `#dailyBtn` with `preventScroll` after the menu is rendered, for
  both Change mode and Quit run. No layout, copy or state changes.
- **Visual proof** (same seeded Daily #312 loss result, same keyboard-only tab sequence to
  Change mode, same 1440x900 viewport):
  - before: `shots/afterimage/cycle14/before-menu-focus.png` (sha256 6AE51832CEFE621C…)
    shows the menu with no focus ring and `activeId: ""`.
  - after: `shots/afterimage/cycle14/after-menu-focus.png` (sha256 0E9BA75B1B4076FB…)
    shows the white Daily card focus ring, `activeId: "dailyBtn"`, `focusVisible: true`.
- **Played run**: the loss result was navigated entirely by keyboard (four Tabs: Copy result →
  Play again → Save card → Change mode), Change mode returned to the menu with focus on
  Today's board. Logs: `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 74/74 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 15 — Keyboard focus: result entry and dialog label

- **Area**: keyboard focus / result entry (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus).
- **Defect (reproduced)**: both the loss and the won replay opened the result screen with
  `document.activeElement` on `BODY`, while `#veil` kept `aria-labelledby="title"` pointing at
  the hidden menu heading. Keyboard and screen-reader users were not placed at the result.
- **Files**: `game.js` (focus the result card and swap the dialog label), `index.html`
  (`#over tabindex="-1"`), `styles.css` (result focus glow), `tests/web-shell.test.js`
  (failing-first contract), `sw.js` + `tests/pwa.test.js` (cache v19), `README.md` (keyboard
  result note).
- **Fix**: `finish` points the veil at `resultTitle`, focuses `#over`, and `showMenu` restores
  the menu label. The focused result card gets a purple border/glow.
- **Visual proof** (same seeded Daily #312 loss result, same 1440x900 viewport):
  - before: `shots/afterimage/cycle15/before-loss-result.png` (sha256 E45A189B4BADE3FC…)
    shows an ordinary result card with `activeId: ""`.
  - after: `shots/afterimage/cycle15/after-loss-result.png` (sha256 33B3C90A47CAF265…)
    shows the focused card’s purple glow with `activeId: "over"`.
- **Played run**: a three-miss loss and a full 10-board winning replay both landed focus on
  `#over`, both set the veil label to `resultTitle`; the win result read `Daily cleared.`,
  5,580, 10/10. Frames `before-win-result.png` / `after-win-result.png`; logs
  `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 75/75 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 16 — Keyboard focus: wrong-pick recovery in the grid

- **Dead end (recorded, no change)**: installed-PWA offline behavior already works. A warm offline
  reload of `/?mode=daily` played a full 10/10 Daily, and a cold browser restart with the same
  profile and network disabled also loaded the Daily board. Evidence:
  `shots/afterimage/cycle16/offline-dead-end.json` / `.png`.
- **Area**: keyboard focus / in-grid wrong-pick recovery (covered: progression/saves, UI
  readability, graphics/effects, responsive layout, levels, save resilience, failure feedback,
  audio cues, debrief copy, boss presentation, daily-best results, save-card fallback, copy
  fallback, menu focus, result focus, in-grid wrong-pick focus).
- **Defect (reproduced)**: a nonfatal wrong pick hides the grid while the focused cell is inside
  it (`ui.cells.classList.add("off")`), so focus falls to `BODY`; the 640ms play reset removes
  the hidden state but never restores focus. The before log shows `activeTag: BODY` and
  `recovered: null`; the keyboard user cannot arrow back to the odd tile.
- **Files**: `game.js` (restore the picked cell’s tab stop and focus after the pause),
  `tests/web-shell.test.js` (failing-first focus contract), `sw.js` + `tests/pwa.test.js`
  (cache v20), `README.md` (keyboard note).
- **Fix**: on the nonfatal wrong branch, clear every cell’s tab stop, set the picked cell to
  `tabIndex = 0`, and focus it after `off` is removed. No scoring, layout or save changes.
- **Visual proof** (same seeded Daily #312, same wrong pick on cell 0, same 1440x900 viewport):
  - before: `shots/afterimage/cycle16/before-wrong-focus.png` (sha256 D331450F4CD52A42…)
    shows the board after the miss with no grid focus ring.
  - after: `shots/afterimage/cycle16/after-wrong-focus.png` (sha256 5AE8A9F0F4F2FFCC…)
    shows the white focus ring on the picked cell.
- **Played run (keyboard only)**: wrong pick on cell 0 → focus returns to cell 0
  (`focusVisible: true`) → two ArrowDowns and one ArrowRight reach the odd cell 7 → Enter
  clears the board, level advances to 1 with 210 points. The before build stops at `BODY` and
  cannot recover. Logs: `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 76/76 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 17 — Initial focus: first load lands inside the menu

- **Dead end (recorded, no change)**: score-card overflow. Synthetic max daily, hinted daily,
  loss daily and Nightmare cards all render inside the 1200x630 frame with no clipped or
  overlapping text. Evidence: `shots/afterimage/cycle17/dead-end-*-daily.png` /
  `dead-end-nightmare.png`.
- **Area**: modal initial focus (covered: progression/saves, UI readability, graphics/effects,
  responsive layout, levels, save resilience, failure feedback, audio cues, debrief copy, boss
  presentation, daily-best results, save-card fallback, copy fallback, menu focus, result focus,
  in-grid wrong-pick focus, initial modal focus).
- **Defect (reproduced)**: first load left `document.activeElement` on `BODY`; the first Tab
  reached the brand link behind the open modal veil. The before log shows
  `activeTag: BODY`, then `A / AFTERIMAGE` after one Tab, and `started: null`.
- **Files**: `game.js` (boot focus), `styles.css` (the Daily card’s `:focus` outline),
  `tests/web-shell.test.js` (failing-first boot contract), `sw.js` + `tests/pwa.test.js`
  (cache v21), `README.md` (keyboard note).
- **Fix**: the boot block focuses `#dailyBtn` with `preventScroll` after the menu is shown; the
  Daily card’s focus outline now uses `:focus` so the programmatic first-load focus is visible.
- **Visual proof** (same fresh save, same 1440x900 viewport; focus emulation enabled so the
  window focus state matches a real user):
  - before: `shots/afterimage/cycle17/before-initial-menu.png` (sha256 7A68D4550C809E3C…)
    shows no focus ring anywhere.
  - after: `shots/afterimage/cycle17/after-initial-menu.png` (sha256 67472D2B6B989631…)
    shows the white ring around Today's board.
- **Played run**: first load focuses `dailyBtn` (`focusVisible: true`); Enter starts the Daily
  run immediately and grid focus moves to cell 0. The before build cannot start from the
  initial state (`started: null`). Logs: `before-log.json` / `after-log.json`; zero console
  errors.
- **Gate results**: `node --test tests` 77/77 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 18 — Modal focus containment

- **Area**: modal keyboard containment (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment).
- **Defect (reproduced)**: the veil declares `aria-modal="true"` but Tab was not contained.
  Shift+Tab from the Daily card focused `SOUND ON` behind the menu, and Shift+Tab from the
  result card did the same; the before log shows `inMenu: false, inOver: false` for both.
- **Files**: `game.js` (`trapDialogFocus` on document keydown), `styles.css` (visible
  `.btn`/`.copy` focus rings), `tests/web-shell.test.js` (failing-first trap contract), `sw.js`
  + `tests/pwa.test.js` (cache v22), `README.md` (keyboard note).
- **Fix**: while the veil is open, Tab and Shift+Tab wrap among the visible focusable controls
  of the active card (`#menu` or `#over`), including the copy fallback when open; focus that
  starts on the card or outside it is redirected to the first/last control.
- **Visual proof** (same seeded Daily #312, same 1440x900 viewport, keyboard Shift+Tab):
  - before: `shots/afterimage/cycle18/before-menu-shift-tab.png` (sha256 FE9E55DED442C91B…)
    shows no focus ring in the dialog; focus is on the hidden SOUND button.
  - after: `shots/afterimage/cycle18/after-menu-shift-tab.png` (sha256 2B95E0D638A0D73F…)
    shows the Onslaught card ring; focus stays in the menu. Result pair:
    `before-result-shift-tab.png` / `after-result-shift-tab.png`.
- **Played run (keyboard only)**: Shift+Tab from Daily wraps to Onslaught; Enter starts the
  Daily run; three Enter misses end at 0/10; Shift+Tab from the result focuses Change mode,
  then Tab wraps to Copy result. All focus stays inside the active dialog, zero console errors.
  Logs: `before-log.json` / `after-log.json`.
- **Gate results**: `node --test tests` 78/78 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 19 — Mode bests: a failed run is not a personal best

- **Area**: Blitz/Nightmare/Focus mode bests and result flow (covered: progression/saves, UI
  readability, graphics/effects, responsive layout, levels, save resilience, failure feedback,
  audio cues, debrief copy, boss presentation, daily-best results, save-card fallback, copy
  fallback, menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal
  containment, mode bests).
- **Defect (reproduced)**: clearing one board then losing set a personal best and showed
  `NEW BEST` for Blitz (320, 1/10, 33%), Nightmare (650, 1/8, 50%) and Focus (270, 1/10, 25%).
  A failed attempt could outrank a later completed run.
- **Files**: `game.js` (pure `bestEligible`, gate on `saveBest`), `tests/game.test.js`
  (failing-first test), `tests/harness.js` (export), `sw.js` + `tests/pwa.test.js` (cache v23),
  `README.md` (completed-run wording).
- **Fix**: `bestEligible(won, timed, best)` requires a completed run, a timed mode and a
  best-bearing mode; only then does `finish` call `saveBest` and show `NEW BEST`. Existing
  saved bests are untouched.
- **Visual proof** (same deterministic Blitz run, same 1440x900 viewport, same 1-clear loss at
  320):
  - before: `shots/afterimage/cycle19/before-blitz-loss.png` (sha256 BCC8B7613E084E8B…)
    shows `NEW BEST` on `FOCUS LOST`.
  - after: `shots/afterimage/cycle19/after-blitz-loss.png` (sha256 74223AA8A0E142C8…)
    shows the same loss with no badge and `bests.blitz: 0`.
- **Played run**: after the loss, a replay cleared 10/10 Blitz boards at 100% for 7,040,
  showed `NEW BEST`, and stored `bests.blitz: 7040`; the loss did not save. The mode audit
  confirms Blitz, Nightmare and Focus losses all leave `newBestHidden: true` and bests at zero.
  Logs: `before-log.json` / `after-log.json` / `mode-loss-audit-after.json`; zero console errors.
- **Gate results**: `node --test tests` 79/79 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 20 — Persisted saves: version, migrate, refuse future

- **Dead end (recorded, no change)**: Onslaught repeated-run persistence. A win saved
  `BEST 5,250 · CLEARED`, a following loss kept it and added a run, a reload preserved it, and
  a second equal-score win left the best unchanged. Evidence:
  `shots/afterimage/cycle20/dead-end-onslaught-*.png` / `dead-end-onslaught-log.json`.
- **Area**: persisted state format versioning (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning).
- **Defect (reproduced)**: the project guideline requires a format version and refusal of
  unsupported versions, but the structured saves had none. A version-2 profile loaded as 99
  runs and the next hint save dropped the version and overwrote the file
  (`hintsUsed` 7→8, `version` gone).
- **Files**: `game.js` (`SAVE_VERSION`, `parseStoredObject`, blocked-key guard, versioned
  writers), `tests/game.test.js` (failing-first version/refusal tests), `tests/harness.js`
  (exports), `sw.js` + `tests/pwa.test.js` (cache v24), `README.md` (save version note).
- **Fix**: `afterimage.bests`, `.daily` and `.profile` write `version: 1`. Loaders accept
  legacy versionless saves as v1; an unsupported or malformed version blocks that key so no
  later write can overwrite it.
- **Visual proof** (same future-version profile/bests, same 1440x900 viewport):
  - before: `shots/afterimage/cycle20/before-future-save-menu.png` (sha256 CB513191041CBC3D…)
    shows `EYE LV 10 · 99 CLEARS · 99 RUNS` and `BEST 9,999 · CLEARED`.
  - after: `shots/afterimage/cycle20/after-future-save-menu.png` (sha256 67472D2B6B989631…)
    shows `EYE LV 1 · 0 CLEARS · 0 RUNS` with no best, while the raw save is untouched.
- **Played run**: start Focus, press H (a profile-saving hint). Before: raw profile loses
  `version: 2` and is overwritten with `hintsUsed: 8`. After: in-memory `hintsUsed` becomes 1
  but `afterimage.profile` and `afterimage.bests` remain byte-identical version-2 JSON; zero
  console errors. Logs: `before-log.json` / `after-log.json`.
- **Gate results**: `node --test tests` 81/81 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 21 — Progression: quitting keeps the attempt

- **Area**: abandoned-run accounting (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics).
- **Defect (reproduced)**: clearing two Focus boards then pressing **Quit run** returned to a
  menu reading `EYE LV 1 · 0 clears · 0 runs`. The attempt and its cleared boards vanished
  because only the finished-result path touched profile runs/clears/bestStreak.
- **Files**: `game.js` (pure `abandonedTotals`, `quitRun`), `tests/game.test.js`
  (failing-first test), `tests/harness.js` (export), `sw.js` + `tests/pwa.test.js` (cache v25),
  `README.md` (Quit run note).
- **Fix**: Quit run now adds one run, adds `state.cleared` to lifetime clears, keeps the
  maximum run streak, saves the versioned profile, and then opens the menu. Change mode and the
  finished-result path are unchanged, so completed runs are not double-counted.
- **Visual proof** (same fresh save, same two-cleared Focus boards, same 1440x900 viewport):
  - before: `shots/afterimage/cycle21/before-after-quit-menu.png` (sha256 87009D82FCF9450F…)
    shows `EYE LV 1 · 0 CLEARS · 0 RUNS`.
  - after: `shots/afterimage/cycle21/after-after-quit-menu.png` (sha256 048836CEA95A3002…)
    shows `EYE LV 1 · 2 CLEARS · 1 RUN`.
- **Played run**: quit after two clears stores `{runs:1, clears:2, bestStreak:2, version:1}`;
  a following Focus run that clears one board then loses adds exactly one run and one clear
  (`runs:2, clears:3`), proving the finished path is not double-counted. Logs:
  `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 82/82 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 22 — Save honesty: no best that cannot persist

- **Area**: blocked-save result honesty (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty).
- **Defect (reproduced)**: with a future-format `afterimage.bests` (version 2, focus 9,999),
  a full Focus win updated the in-memory best to 5,580 and showed `NEW BEST` while the raw file
  stayed untouched; after reload the best was gone (`CLEARED` only).
- **Files**: `game.js` (`saveBest` refuses blocked keys before mutating), `tests/game.test.js`
  (failing-first blocked-best test), `sw.js` + `tests/pwa.test.js` (cache v26), `README.md`
  (save note).
- **Fix**: `saveBest` returns false when `afterimage.bests` is a blocked future format, so no
  in-memory best mutation and no `NEW BEST` callout. The future file remains byte-identical.
- **Visual proof** (same future bests, same deterministic full Focus win at 5,580, same
  1440x900 viewport):
  - before: `shots/afterimage/cycle22/before-focus-win.png` (sha256 71A06BC44E613ACB…)
    shows `EAGLE EYE` with `NEW BEST`.
  - after: `shots/afterimage/cycle22/after-focus-win.png` (sha256 86EBC16B8C9BFF67…)
    shows the same win with only `EAGLE EYE`.
- **Played run**: full Focus 10/10 at 100% for 5,580; before `state.bests.focus` became 5,580
  while raw stayed version 2; after it stayed 0, raw stayed version 2, and the reloaded menu
  showed only `CLEARED`. Logs: `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 83/83 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 23 — Daily save honesty: no unpersistable daily claims

- **Area**: blocked daily-save result honesty (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty).
- **Defect (reproduced)**: with a future-format `afterimage.daily` (version 2, streak 9), a full
  daily win showed `NEW DAILY BEST` and updated the in-memory daily to result 5,580/streak 1
  while the raw file stayed untouched; reloading showed a fresh daily.
- **Files**: `game.js` (`recordDaily` returns early when the daily key is blocked),
  `tests/game.test.js` (failing-first blocked-daily test), `tests/harness.js` (export),
  `sw.js` + `tests/pwa.test.js` (cache v27), `README.md` (save note).
- **Fix**: a blocked `afterimage.daily` is read-only for the session: no daily last/streak/
  result mutation, no `NEW DAILY BEST`, no write. The future file remains byte-identical.
- **Visual proof** (same future daily, same deterministic full daily win at 5,580, same
  1440x900 viewport):
  - before: `shots/afterimage/cycle23/before-daily-win.png` (sha256 A83D96F27E2ACAF7…)
    shows `EAGLE EYE` with `NEW DAILY BEST`.
  - after: `shots/afterimage/cycle23/after-daily-win.png` (sha256 4A57F58F7EF62C53…)
    shows the same win with only `EAGLE EYE`.
- **Played run**: full Daily 10/10 at 100% for 5,580; before `state.daily` became
  `{last: 2026-11-08, streak: 1, result: 5580}`, after it stayed `{last: "", streak: 0,
  result: null}`, the raw version-2 daily stayed identical, and the reloaded menu showed a
  fresh daily. Logs: `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 84/84 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 24 — Profile honesty: no unpersisted freeze/clear claims

- **Dead end (recorded, no change)**: daily streak-freeze earn/consume end to end. A win after
  yesterday advanced the streak and armed one freeze; a win after one missed day with a
  non-perfect run consumed the freeze and advanced the streak; a gap of two missed days reset
  the streak and kept the freeze. Evidence: `shots/afterimage/cycle24/dead-end-freeze-audit.json`.
- **Area**: blocked profile-save honesty (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty,
  blocked-profile honesty).
- **Defect (reproduced)**: with a future-format `afterimage.profile`, a perfect daily win
  added “Streak freeze earned — one missed day forgiven. First Daily clear!” and in-memory
  `freezes:1`/`wins.daily:1`, while the raw profile stayed version 2; reloading lost all of it.
- **Files**: `game.js` (blocked profile guards in `finish`, `quitRun`, `useHint`, `earnFreeze`),
  `tests/game.test.js` (failing-first blocked-freeze test), `sw.js` + `tests/pwa.test.js`
  (cache v28), `README.md` (save note).
- **Fix**: a blocked profile is read-only for the session. `finish` skips profile
  runs/clears/bestStreak/wins updates and saves; `quitRun`, `useHint` and `earnFreeze` also
  refuse to mutate a blocked profile. The daily save remains independent and still records its
  own result.
- **Visual proof** (same future profile, same perfect daily win at 5,580, same 1440x900
  viewport):
  - before: `shots/afterimage/cycle24/before-daily-win.png` (sha256 A83D96F27E2ACAF7…)
    includes the freeze-earned and first-clear sentences.
  - after: `shots/afterimage/cycle24/after-daily-win.png` (sha256 D22B5151C8A1DBE3…)
    has neither sentence; the daily result itself remains.
- **Played run**: full Daily 10/10 at 100% for 5,580. Before, in-memory profile became
  `{runs:1, clears:10, freezes:1, wins.daily:1}` while raw stayed version 2; after it stayed
  all zeros, raw stayed version 2, and the daily still saved `{last: 2026-11-08, streak: 3,
  result: 5580}`. Reloaded menu showed the 3-day streak without a freeze. Logs:
  `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 85/85 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 25 — HUD readability: a readable clock

- **Area**: HUD readability / timer accessibility (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty,
  blocked-profile honesty, timer readability).
- **Defect (reproduced)**: the only clock was a 3px bar with `aria-label="Time remaining"` and
  no value. The before log shows no `data-time`, an empty text node, and no second-level value
  for assistive tech; at a glance players could only estimate the slice of bar left.
- **Files**: `game.js` (pure `timerLabel`, per-second `data-time`/ARIA update),
  `styles.css` (right-edge timer readout), `tests/game.test.js` (failing-first label test),
  `tests/web-shell.test.js` (readout/value contract), `sw.js` + `tests/pwa.test.js` (cache
  v29), `README.md` (timer note).
- **Fix**: the timer bar now renders `12s` at its right edge and updates its
  `aria-label` to `Time remaining: 12 seconds` only when the whole second changes. Untimed Zen
  clears both. The fill gets its own radius so the bar can stop clipping the readout.
- **Visual proof** (same deterministic Focus board, same 12,000ms remaining, same 1440x900
  viewport, timer crop):
  - before: `shots/afterimage/cycle25/before-timer.png` (sha256 E701F987CA356450…)
    shows the bare bar.
  - after: `shots/afterimage/cycle25/after-timer.png` (sha256 D1F4824A09A8D43C…)
    shows `12S` above the right end.
- **Played run**: set to 12,000ms → readout `12s` / ARIA 12 seconds; after 1.1s → `11s` /
  11 seconds; a wrong pick drops Focus to 2 while the readout stays live. Logs:
  `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 87/87 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 26 — HUD readability: counted lives

- **Area**: HUD readability / lives accessibility (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty,
  blocked-profile honesty, timer readability, lives readability).
- **Defect (reproduced)**: the lives HUD was three unlabeled dots. The before log shows
  `text: "Focus"`, no `lifeCount`, and no `aria-label`; sighted players had to count 7px dots
  and assistive tech received no value.
- **Files**: `index.html` (count span + labelled dots), `styles.css` (`.life-count`),
  `game.js` (pure `livesLabel`, count/ARIA updates), `tests/game.test.js` (failing-first label
  test), `tests/web-shell.test.js` (HUD contract), `sw.js` + `tests/pwa.test.js` (cache v30),
  `README.md` (lives note).
- **Fix**: a visible numeric count sits after the dots; the dots expose an ARIA label such as
  `3 of 3 focus remaining`; untimed Zen reports `No focus limit`. Both update after every loss.
- **Visual proof** (same deterministic Focus start, same 1440x900 viewport, fixed HUD crop):
  - before: `shots/afterimage/cycle26/before-lives-3.png` (sha256 2F4E3853DA730F57…)
    shows three dots and no count.
  - after: `shots/afterimage/cycle26/after-lives-3.png` (sha256 E1BD211AF7A7CC8C…)
    shows the same dots with a visible `3`.
- **Played run**: a wrong pick drops the HUD from `Focus 3` / `3 of 3 focus remaining` to
  `Focus 2` / `2 of 3 focus remaining`; two dots remain lit. Crop
  `after-lives-2.png`; logs `before-log.json` / `after-log.json`; zero console errors.
- **Gate results**: `node --test tests` 89/89 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 27 — Mobile HUD: the streak keeps its label

- **Area**: HUD readability / narrow-screen labels (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty,
  blocked-profile honesty, timer readability, lives readability, mobile streak label).
- **Defect (reproduced)**: at 390x844 the HUD hid the Streak label, leaving a bare trailing
  `0` after the new lives count. The before crop shows Mode/Level/Score, dots + `3`, then an
  unlabeled `0`; players cannot tell which value it is.
- **Files**: `styles.css` (remove the narrow-screen streak-label hide), `tests/web-shell.test.js`
  (failing-first mobile label contract), `sw.js` + `tests/pwa.test.js` (cache v31), `README.md`
  (mobile note).
- **Fix**: the 640px breakpoint no longer hides `.hud-item.streak .k`; the existing HUD keeps
  its five labels on phones.
- **Visual proof** (same Focus start, same 390x844 viewport):
  - before: `shots/afterimage/cycle27/before-hud-390.png` (sha256 5B3CF452C586E1C1…)
    shows the unlabeled trailing `0`.
  - after: `shots/afterimage/cycle27/after-hud-390.png` (sha256 80FF69AF2A7162B0…)
    shows `Streak 0` at the same position, with `scrollWidth: 390`.
- **Fit/played run**: normal and stressed (`12,345` score, `12 BLAZE` streak) both stay at
  `scrollWidth: 390`; the stressed crop is `after-hud-stressed-390.png`. A played Focus clear
  moves to level 02, 270 points, streak 1; the HUD reads `Streak 1` and the 390px view still
  has no horizontal scroll. Log: `play.json`; zero console errors.
- **Gate results**: `node --test tests` 90/90 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 28 — Mobile HUD: the last unlabeled value

- **Area**: HUD readability / narrow-screen labels (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty,
  blocked-profile honesty, timer readability, lives readability, mobile streak label, mobile
  Focus label).
- **Defect (reproduced)**: at 390x844 the lives block was dots + `3` with no Focus label,
  while Mode, Level, Score and Streak all kept labels. The before crop shows the unlabeled
  dot/count block between Score and Streak.
- **Files**: `styles.css` (remove the <=440px `.hud-item.lives .k` hide),
  `tests/web-shell.test.js` (failing-first mobile label contract), `sw.js` +
  `tests/pwa.test.js` (cache v32).
- **Fix**: the Focus lives label remains visible on narrow screens. The dots + count already
  occupy more width than the label, so the HUD keeps the same item width and only gains the
  missing label row.
- **Visual proof** (same Focus start, same 390x844 viewport):
  - before: `shots/afterimage/cycle28/before-hud-390.png` (sha256 6DF221859E21D881…)
    shows the unlabeled dots + `3`.
  - after: `shots/afterimage/cycle28/after-hud-390.png` (sha256 EAA4CD8689F6F510…)
    shows `Focus` above the dots + `3`, with `scrollWidth: 390`.
- **Fit/played run**: normal and stressed 390px HUDs stay at `scrollWidth: 390`; 320px normal
  and stressed also stay at 320 (`after320-log.json`). A played Focus clear reaches level 02,
  270 points, streak 1 with `Focus` and `Streak` both labelled and no horizontal scroll.
  Log: `play.json`; zero console errors.
- **Gate results**: `node --test tests` 91/91 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 29 — Modal accessibility: isolate the shell

- **Dead end (recorded, no change)**: 390x844 result-card layout with the Copy fallback and Save failure
  open together. The card measured 44..800 inside an 844px veil, `scrollWidth: 390`, and all
  panels/actions/status were visible; at 390x667 the card top stayed visible and the veil
  scrolled, so no overflow fix was warranted. Evidence:
  `shots/afterimage/cycle29/dead-end-layout-390x844.json` / `.png` and
  `dead-end-layout-390x667.json` / `.png`.
- **Area**: modal accessibility / shell isolation (covered: progression/saves, UI readability,
  graphics/effects, responsive layout, levels, save resilience, failure feedback, audio cues,
  debrief copy, boss presentation, daily-best results, save-card fallback, copy fallback,
  menu focus, result focus, in-grid wrong-pick focus, initial modal focus, modal containment,
  mode bests, save versioning, quit statistics, blocked-best honesty, blocked-daily honesty,
  blocked-profile honesty, timer readability, lives readability, mobile labels, modal shell
  isolation).
- **Defect (reproduced)**: the accessibility tree still exposed the background brand link,
  `SOUND ON`, timer and status line while the menu/result dialog was open, even though keyboard
  Tab was trapped. The before AX log lists those nodes; a screen reader's browse mode could
  leave the dialog.
- **Files**: `game.js` (`setShellInert` on menu/result/play), `tests/harness.js` (DOM stubs),
  `tests/web-shell.test.js` (failing-first shell contract), `sw.js` + `tests/pwa.test.js`
  (cache v33), `README.md` (accessibility note).
- **Fix**: menu, result and boot set `.shell` `inert` + `aria-hidden="true"`; starting a run
  removes both. Focus is moved into the dialog before the shell is hidden.
- **Evidence** (same 1440x900 menu/result states; visual parity plus AX tree):
  - menu screenshots are byte-identical before/after (`before-menu.png` / `after-menu.png`,
    sha256 7A68D4550C809E3C…) because inertness is not visual.
  - before AX includes `link AFTERIMAGE VISUAL PERCEPTION`, `button SOUND ON`, `timer` and
    `Pick a mode to begin`; after both menu and result AX lists are empty (`menuAx: []`,
    `resultAx: []`). Logs: `before-log.json` / `after-log.json`.
- **Played run**: boot menu `shellInert: true`; Enter starts Daily with `shellInert: false`;
  three misses produce a result with `shellInert: true` and focus on `#over`; Change mode
  returns to a menu with `shellInert: true`. Zero console errors.
- **Gate results**: `node --test tests` 92/92 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 30 — Performance audit: 10x10 Nightmare (zero findings)

- **Area**: cold-start and frame health for the 10x10 final Nightmare board (covered: all prior
  areas plus performance).
- **Audit**: a scripted Nightmare run cleared seven boards and stopped on the final 10x10 rotate
  board (100 tiles, 32s). Evidence frame:
  `shots/afterimage/cycle30/before-nightmare-10x10.png` (sha256 5EABE8E93FC9C43E…).
- **Measurements**:
  - cold start from navigation to first playable board: 383ms (`cold-log.json`);
  - 10x10 board ready 57ms after `enterAt`; 100 hit areas built;
  - 2.5s steady sample: 151 frames, avg 16.56ms, p95 16.7ms, max 16.8ms, 0 frames over
    50ms, 0 long tasks;
  - TaskDuration +0.334s, ScriptDuration +0.063s, LayoutDuration +0.0003s over the sample.
- **Finding**: no reproducible defect. The frame budget is healthy on the hardest board, so no
  code or asset change was made. Logs: `perf-log.json` / `cold-log.json`.
- **Played run**: Nightmare, seven scripted clears then the final 10x10 board; the run stayed
  playable with the timer/readout and final-board badge intact; zero console errors.
- **Gate results**: `node --test tests` 92/92 pass; `python aikit.py check afterimage` 5/5 pass.
- **Stop condition**: this full cycle found zero verified improvements, so the continuous goal
  is complete under its own rule.

## Cycle 31 — Timed runs: a hide through the pause cannot freeze the next clock

- **Area**: timed-run clock integrity / hidden-tab charging (covered: all prior areas plus
  pause/reveal hidden time).
- **Defect (reproduced)**: the hide handler recorded `hiddenAt` only while the phase was
  `play`. A hide that began during the 680ms post-correct pause (or the 1150ms timeout reveal)
  therefore started the next board while hidden with no hidden start recorded; returning
  charged only the first visible frame. The before probe hid for 3,705ms during the pause, then
  read `remaining: 15000`, `label: "15s"`, and `chargedMs: 206` after returning; the full Focus
  run still scored 5,580.
- **Files**: `game.js` (transient `pendingHidden`, pure `tracksHiddenTime`/`hiddenReturn`, pending
  charge in `nextLevel`, resets on start/finish/menu), `tests/harness.js` (exports),
  `tests/game.test.js` (failing-first phase/charge test), `tests/web-shell.test.js`
  (hide-charge contract), `sw.js` + `tests/pwa.test.js` (cache v34), `README.md` (hidden-time
  note).
- **Fix**: the hide path now records hidden time in `play`, `pause` and `reveal`. Returning
  during play charges immediately; returning during pause/reveal carries the interval as
  `pendingHidden`, which the next board subtracts from its clock. Hides on the menu or result
  stay free, and start/finish/menu clear the transient fields.
- **Visual proof** (same 1440x900 viewport, same `?mode=focus` start, same correct first pick,
  hide during the 680ms pause, 3.0s hidden, then return, timer crop):
  - before: `shots/afterimage/cycle31/before-timer-visible.png` (sha256
    3F28B0E05858C0C7…) shows `15S` and a full bar after returning; the 3.7s hidden interval
    cost 206ms.
  - after: `shots/afterimage/cycle31/after-timer-visible.png` (sha256 F8342318FD10EAAC…) shows
    `11S` and a consumed bar; 4,138ms was charged end-to-end, including the hidden 3.7s.
  - hidden-state pair: `before-timer-hidden.png` / `after-timer-hidden.png` are byte-identical
    (sha256 B5CF9238008C2359…), both `15S`, proving the same mid-hide starting point.
- **Played run**: the same scripted run cleared all 10 Focus boards at 100% (`Nice eyes.`,
  EAGLE EYE) after the charge; the before run scored 5,580 with a full clock, the after run
  5,540 with the 4.1s charge reflected in the speed bonus; zero console errors. Logs
  `before-log.json` / `after-log.json`; frames `before-result.png` / `after-result.png`.
- **Gate results**: `node --test tests` 95/95 pass; `python aikit.py check afterimage` 5/5 pass.

## Cycle 32 — Abandoned runs: a decided run cannot be erased by Quit run

- **Area**: abandoned-run accounting / result integrity (covered: all prior areas plus decided-run
  quit).
- **Defect (reproduced)**: `Quit run` stays enabled during the 1150ms fatal/timeout reveal and the
  680ms post-final-pick pause, but `quitRun` only added abandoned totals and opened the menu. The
  run was already decided in both windows, so quitting erased the outcome. The before probe shows a
  Daily with one clear plus three wrong picks: quit inside the reveal left `rawDaily: null`, the
  menu at `A fresh seeded set`, and `dailySub` unchanged; a Zen run cleared 10/10 and quit inside
  the final pause recorded `runs: 1, clears: 10` but `wins.zen: 0` with no result screen.
- **Files**: `game.js` (transient `pendingOutcome`, pure `decidedOutcome`, marks on the final
  correct pick, the fatal miss and a timeout, decided routing in `quitRun`), `tests/harness.js`
  (export), `tests/game.test.js` (failing-first outcome test), `tests/web-shell.test.js`
  (quit-routing contract), `sw.js` + `tests/pwa.test.js` (cache v35), `README.md` (Quit run note).
- **Fix**: the final correct pick marks `pendingOutcome: "win"` and a fatal miss or timeout marks
  `"loss"`. `quitRun` asks `decidedOutcome(state.phase, state.pendingOutcome)`: inside pause/reveal
  it hands off to `finish`, so the result, daily record, streak and win awards are written exactly
  as a normal ending; a fatal-miss quit also keeps its red board in the strip. Quitting a run that
  is still in play keeps the abandoned-run totals from cycle 21.
- **Visual proof** (same 1440x900 viewport, same seeded Daily #312 and Zen runs, same click
  sequences, quit from the same beat):
  - before: `shots/afterimage/cycle32/before-loss-reloaded.png` (sha256 910128A430F24575…)
    reads `A fresh seeded set` with `PLAY →`; `rawDaily` is `null`.
  - after: `shots/afterimage/cycle32/after-loss-result.png` (sha256 5095689024AF1D97…) shows the
    `DAILY #312 · RUN OVER` result (270, 1/10, `🟩🟥`); `after-loss-reloaded.png` (sha256
    BC93D90E49A8C439…) reads `Played today · 270 · WARMING UP` with `REPLAY →`.
  - win pair: `before-final-beat.png` (sha256 612C53678BF359A6…) / `after-win-result.png`
    (sha256 E0F92C9D12DBB784…); the after screen reads `Zen complete.` 4,210, 10/10, 100%, and the
    profile stores `wins.zen: 1`.
- **Played run**: the scripted Daily loss and the 10-board Zen win both reach their result screens
  from a Quit click inside the closing beat, with the daily record and win persisted; zero console
  errors on both builds. Logs `before-log.json` / `after-log.json`.
- **Gate results**: `node --test tests` 97/97 pass; `python aikit.py check afterimage` 5/5 pass.
