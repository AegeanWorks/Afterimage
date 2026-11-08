# Decisions

Why this project is built the way it is, oldest first. One entry per decision that changes a
contract, a dependency, a data format or the architecture; IDs are consecutive and never reused.

### ADR-001: Adopt AIKit integration, AGL-1.1 licensing, and regression shield
- **Date**: 2026-10-31
- **Status**: Accepted
- **Context**: Afterimage was unmanaged and lacked AIKit project memory, licensing metadata, and automated tests, preventing it from meeting AIKit publish standards.
- **Decision**: Integrated project with AIKit memory (`.aikit/project.json`), adopted Aegean Game License 1.1 (`AGL-1.1`), seeded REUSE metadata and commercial terms, added `package.json` with Node.js test runner (`node --test tests`), created test harness and regression test suite covering PRNG determinism, daily challenges, scoring, and modes, and updated README to meet PRINCIPLE-005 cold-start requirements.
- **Consequences**: Afterimage satisfies all AIKit publish standards, runs automated tests in Phase 4, and passes all gates (test, mechanics, hygiene, guidelines, secrets).

### ADR-002: Adopt addictivity pack (combos, surge, hints, assist, eye levels)
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Core loop was flat: fixed scripts loosened at the end, mistakes only cost lives, no agency tools or meta-progression, and streaks paid silently — weak flow, low retention hooks.
- **Decision**: Added combo tiers (COMBO/FEVER/BLAZE multipliers + pitch rise), +50 perfect bonus, scripted 1.5× SURGE boards, hint system (H key/button, 1 timed / 3 Zen, streak reset), comeback assist (+30% delta ease after 2 non-green boards), monotonic late-curve rebalance (final classic 7×7 delta 13), and local Eye-Level profile; bumped SW cache to afterimage-v2.
- **Consequences**: All 17 regression tests pass (10 legacy + 7 new); scoring stays backward-compatible via optional params; no new deps or network calls; profile/bests remain local-only.

### ADR-003: Carry combo and perfect proof into results, shares and cards
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Combo tiers and perfect bonuses existed only mid-run; finished results, copied text and PNG cards showed plain score/accuracy, wasting the virality and mastery-display loop.
- **Decision**: Persist `bestTier`/`perfectBoards`/`surgeBoards` on `state.result`, suffix the best-streak stat with its tier, append proof segments to share text and card footer (guarded so field-less results render cleanly), and re-grounded the README share example on the simulated full-clock perfect ceiling (5,580).
- **Consequences**: 19 tests pass (17 prior + 2 share tests incl. backward-compat); share format extends additively, old parsers still match the prefix.

### ADR-004: Add near-miss feedback, first-run coach and low-clock ticks
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Wrong picks felt identical whether miles off or one tile away; new players never learned the hint exists; the final clock seconds passed silently despite the red timer.
- **Decision**: Pure `isAdjacent(n,a,b)` (orthogonal, no wrap) drives "next door" miss messages in timed and Zen modes; pure `firstRunTip(runs,level,hints)` appends the H-hint coach line only on a new player's first board; frame loop ticks audibly at 3-2-1s remaining (muted-safe via `tone` guard, per-board reset).
- **Consequences**: 21 tests pass (19 prior + 2 new); no scoring, script or storage changes; Zen fail-free promise untouched.

### ADR-005: Add goal-gradient beats and weakest-link debrief
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Mid-run motivation sagged with no sense of approaching finish; result blurbs were generic and gave no reason to replay with intent.
- **Decision**: Pure `progressBeat(level,total)` appends halfway/two-left/final-board beats to level callouts; per-type miss counts (`state.typeMisses`, recorded on wrong picks and timeouts, skips excluded) feed pure `weakestType()` whose winner is named in the result blurb with a Zen-practice pointer; menu Eye-LV line gains lifetime runs.
- **Consequences**: 23 tests pass (21 prior + 2 new); no scoring, script, storage-schema or share-format changes (profile shape unchanged).

### ADR-006: Add best-pace chase and streak-earned daily hints
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Personal bests were invisible until the result screen, so there was no mid-run rabbit to chase; daily streaks paid only pride, with no tangible consistency reward.
- **Decision**: Pure `onBestPace(score,boardsDone,total,best)` triggers a one-shot "best pace!" callout (per-run `paceCalled` flag) against the mode best or today's daily best; pure `bonusHints(streak)` grants +1 daily hint at streak 3+ (visible in the HUD hint count); streak labels graduate to ROLLING (3+) and UNSTOPPABLE (7+).
- **Consequences**: 25 tests pass (23 prior + 2 new); no scoring, script, storage-schema or share-format changes; Zen untouched (untimed, no pace callout).

### ADR-007: Add daily streak freeze insurance
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: A single missed day reset the whole daily streak to zero — the harshest churn driver in the game, punishing one slip with total loss.
- **Decision**: A perfect daily win (won, 100% accuracy) earns one stored freeze (cap 1, `profile.freezes`); pure `freezeRepair(last,day)` detects exactly-one-missed-day gaps, consuming the freeze to continue the streak instead of resetting; pure `earnFreeze(won,accuracy)` gates earning; menus show "freeze armed" and results announce newly earned freezes.
- **Consequences**: 27 tests pass (25 prior + 2 new); profile gains one capped numeric field, fully backward-compatible with old saves; no scoring, script or share changes.

### ADR-008: Track per-mode mastery with badges and first-clear callouts
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: Winning a mode left no persistent mark besides a number, so there was no collection-style reason to clear every mode.
- **Decision**: `profile.wins` counts wins per mode (sanitized, backward-compatible with old saves); pure `bestLine(best,wins)` renders `BEST x`, `CLEARED`, or both on mode buttons (Zen included via a new `data-best` node); first clears append a result-blurb callout.
- **Consequences**: 29 tests pass (27 prior + 2 new); no scoring, script, storage-breaking or share changes; note: cross-realm `deepStrictEqual` on vm-created objects fails on prototypes, so the wins test asserts per-key.

### ADR-009: Add Onslaught as DATA (surge-heavy 8-board mode)
- **Date**: 2026-11-02
- **Status**: Accepted
- **Context**: The mode list topped out at Nightmare; experienced players wanted a denser scoring mode without touching the tuned classic/nightmare/daily curves or the verified 5,580 Focus ceiling.
- **Decision**: New `SCRIPTS.onslaught` (8 boards, 3x3 to 9x9, three SURGE boards, 1.25x `MODES.onslaught` with 2 lives and 0.8 timeScale) added as pure DATA validated by the now-generic script-integrity test; wired through the existing gates only — menu button with `data-best` node, `loadBests`/`profile.wins` keys, manifest shortcut, deep link, SW cache bump. Classic, nightmare and daily scripts untouched.
- **Consequences**: 32 tests pass (29 prior + 3 new); old saves migrate silently (missing keys default to zero); no scoring, share or PWA-contract changes.

### ADR-010: Register current screenshots; legacy captures stay as unregistered art
- **Date**: 2026-11-03
- **Status**: Accepted
- **Context**: `assets/menu.png`, `nightmare.png` and `card.png` predate the media pipeline (no `media.json` entries, no README block, no commit record) and `menu.png` is stale content (four modes, daily #304; the game now ships five modes with Onslaught).
- **Decision**: Keep the three legacy files untouched in `assets/` (ASSETS.md already covers `assets/*.png`); capture `2026-11-03-menu.png` (clean-storage first run, daily #307, DAY ONE) and `2026-11-03-daily.png` (Daily 01/10 hue board after PLAY) from `python -m http.server 8139` at viewport 1440x900, commit `5be4c63`, and register only the two new keepers in `.aikit/media.json` and the README `aegean:screenshots` block.
- **Consequences**: README proves the current five-mode build; legacy files remain history, not proof. Reproduce with: serve 8139, clear storage, open the URL, screenshot, click PLAY on Today's board, screenshot.

### ADR-011: Harden share-text mode lookup and correct Onslaught docs
- **Date**: 2026-11-04
- **Status**: Accepted
- **Context**: Swarm analysis (7 modules) found `buildShareText` dereferenced `MODES[result.mode]` without the fallback `renderScoreCard` already used, so corrupt/unknown modes crashed copy; README omitted Onslaught bests/shortcuts and `ASSETS.md` glob missed `assets/screenshots/` keepers.
- **Decision**: Fall back unknown share modes to Focus (`MODES[result.mode] || MODES.focus`); correct README bests sentence, perfect-title mapping, and manifest shortcut list; widen `ASSETS.md` to `assets/**/*.png` with legacy note. Legal items (AL-1.1 vs AGL-1.1 naming, missing `LicenseRef-AL-1.1` text, dangling `ASSET_POLICY.md`) deferred to owner.
- **Consequences**: 34 tests pass (33 prior + 1 new fallback test); no scoring, script, storage or PWA-contract changes; `python aikit.py check afterimage` 5/5 green.

### ADR-012: Land verified swarm hardening across engine, PWA, shell and tooling
- **Date**: 2026-11-04
- **Status**: Accepted
- **Context**: Seven-module swarm returned reproduced defects beyond ADR-011: malformed calendar keys threw cross-realm errors, `onBestPace`/`bestLine` accepted degenerate inputs, `ensureAudio` crashed on throwing constructors, canvas `roundRect` froze older browsers, keyboard focus died on board transitions, hinted runs earned perfect titles/freezes and false `NO HINTS` cards, all-skip Zen runs minted wins, PWA install aborted on one 404 with divergent `/` vs `/index.html` and empty 504s, shell hid lives/streak/mode and exposed decorative canvas while hiding the timer, and `make_icons.py` mutated `icons/` on import with 1px overshoot.
- **Decision**: Guard calendar helpers with `isValidDateKey` (TypeError on malformed), clamp `onBestPace` to `0<=done<=total`, coerce `bestLine` via `Number`, guard `ensureAudio`/resume, add `traceRoundRect` fallback for all 12 sites, restore grid focus in `nextLevel`, track `hintsUsedRun` (attempts+1, footer/share proof, rating capped at 84 when assisted, freeze requires zero hints, wins require clears>0), make SW install atomic-safe with `allSettled`+core gate, unify `/`+`/index.html`, type offline fallback as 503, scope activate to `afterimage-*`, bump `CACHE` to `afterimage-v6`, declare veil dialog semantics with AT-hidden canvas and labelled grid plus `noscript`, keep HUD state visible at small widths with `svh`/`aspect-ratio`/`best` overflow fallbacks, move `OUT.mkdir` into `main` with Pillow `Why/Fix` guard and inclusive-box geometry fix, regenerate 4 icons.
- **Consequences**: 54 tests pass (34 prior + 20 new: calendar, pace, bestLine, audio, date-key, roundRect, focus, hint-share, 6 PWA, 5 web-shell, tooling); timed scoring, scripts, storage schemas and share backward-compat preserved (clean runs render legacy lines); `python aikit.py check afterimage` 5/5 green after map refresh. Deferred to owner: commercial-license naming (`AL-1.1` vs `AGL-1.1`), missing `LicenseRef-AL-1.1` text, dangling `ASSET_POLICY.md`, wall-clock timer pause, midnight-board attribution.

### ADR-013: Charge hidden-tab time and fix license references
- **Date**: 2026-11-04
- **Status**: Accepted
- **Context**: Timed runs were pausable by hiding the tab (`visibilitychange` reset `lastFrame`, `dt` clamped to 50ms, so 30s hidden cost ~0ms). License tier named `AL-1.1` while the LICENSE file is `AGL-1.1`, and the asset-grant path pointed at a missing `ASSET_POLICY.md`.
- **Decision**: Track `hiddenAt` on hide during timed play and subtract wall-clock hidden time via pure `hiddenPenalty` on visible (floor 0, timeout when exhausted); correct personal-tier identifiers to `AGL-1.1` (`COMMERCIAL.md` model/table/scope) and replace the dangling `ASSET_POLICY.md` filename with the published grant contact (`aegean-licensing@proton.me`) in `LICENSE` and `COMMERCIAL.md`. Base-license section cites (`AL-1.1` 4.3/5.6/7) left for owner/counsel; midnight-board attribution stays on the start day (board identity), not re-keyed.
- **Consequences**: 56 tests pass (54 prior + 2 new: `hiddenPenalty`, visibility wiring); honest play unchanged (visible-tab timing identical), hidden tabs now cost wall-clock time; `python aikit.py check afterimage` 5/5 green.

### ADR-014: Advance daily streaks only on completed dailies
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: `recordDaily` advanced `state.daily.streak` and marked the day complete on the first finish of any daily run, win or loss. A reproduced 3-day save plus three wrong picks became a 4-day streak in the menu, contradicting the README promise that the streak grows each day the daily is finished.
- **Decision**: Extract pure `dailyStreakAfter(last, streak, freezes, day, won)`: only a completed daily advances `last`/`streak`; same-day replays cannot double-count; a one-day gap spends a freeze only on the winning finish; a loss leaves the prior completed day untouched and renders the current streak as *at risk* in the menu and result blurb so a replay can still save it.
- **Consequences**: 57 tests pass (56 prior + 1 failing-first test with 8 assertions); `afterimage.daily` keeps its shape, and losses still record the day's best score; a loss no longer mints streak progress or bonus-hint eligibility. Scripted before/after daily playthrough is recorded in `.aikit/cycles.md`, with local screenshots under `shots/afterimage/cycle1/`; `python aikit.py check afterimage` green.

### ADR-015: Give the menu status row a stable two-band grid
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: The menu `.meta` row was a single flex line. At 1440x900 its three children each wrapped to two lines, and `renderDaily` printed ungrammatical counts such as "1 runs" and "1 clears", making the first screen cramped.
- **Decision**: Replace the flex row with a two-column grid: the privacy note spans the first band, Eye LV (left) and streak (right) share the second, and below 500px the best labels stack left-aligned. Add pure `profileLine(clears, runs)` with numeric guards and correct singular/plural labels.
- **Consequences**: 58 tests pass (57 prior + 1 failing-first test with 4 assertions); at 1440x900 the second band measures 221px + 197px inside a 430px row and no longer wraps, while 390x844 renders three clean left-aligned lines. A played Zen run (10/10, 100%, 4,210) landed on `EYE LV 2 · 10 clears · 1 run` with the Zen `CLEARED` badge. No scoring or storage changes; `python aikit.py check afterimage` green.

### ADR-016: Put correct-pick payoff at the tile
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: Correct picks were rewarded only in the distant HUD, and on size/angle boards the burst used the same color as every tile, so the success moment had no local, readable payoff.
- **Decision**: Add pure `sparkColor(def, oddColor)` and `scorePopText(gain)`; use accent teal sparks for shape boards, and spawn a transient gold `+points` pop at the picked tile (dark offset for contrast) that is painted above the particles and cleared on every board change. Reduced-motion users keep the static feedback only.
- **Consequences**: 59 tests pass (58 prior + 1 failing-first test with 7 assertions). A played Daily #311 run produced one pop per board matching the score gain (+270 through +690), accent sparks on all three shape boards, 10/10, 100%, 5,580, EAGLE EYE, zero console errors. Before/after frames are recorded in `.aikit/cycles.md` under `shots/afterimage/cycle3/`; `python aikit.py check afterimage` green.

### ADR-017: Wrap phone play controls instead of overflowing
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: At 390x844 the Focus play screen overflowed horizontally (`scrollWidth` 449). The desktop topbar put brand, five HUD values and SOUND on one line, so the sound control left the viewport and the streak value clipped on the installed-PWA form factor.
- **Decision**: At 640px and below, wrap the topbar: brand and sound share the first row; the HUD takes a full-width second row with left-aligned stats, lives pushed right, and the sound control pinned via auto margin. Bump the service-worker cache to `afterimage-v8` because shell assets changed in cycles 2–4.
- **Consequences**: 60 tests pass (59 prior + 1 failing-first CSS contract; cache pin updated to v8). Measured at 390x844: `scrollWidth` 449→390, HUD right 354→374, sound right 374 (inside), stage remains 358px. A mobile Focus run (level 02, 270, two lives) kept every value and control inside the viewport with zero console errors. Desktop layout is unchanged above 640px; `python aikit.py check afterimage` green.

### ADR-018: Keep the SURGE bonus visible for the whole board
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: SURGE 1.5× was announced only in the opening status line. A wrong pick replaced that line with "Not that one", so Daily board 4 still paid 1.5× while the screen no longer said so.
- **Decision**: Add an aria-hidden `SURGE · 1.5×` pill inside the stage's top-left padding, driven by `def.surge` in `nextLevel`; hide it on normal boards and on start/finish/menu paths. Bump the service-worker cache to `afterimage-v9` for the changed shell.
- **Consequences**: 61 tests pass (60 prior + 1 failing-first shell contract; cache pin v9). A played Daily #311 run showed the badge on exactly boards 4 and 8, hid it on the other eight and after the result, and still scored 10/10, 100%, 5,580 with zero console errors. Before/after frames are recorded in `.aikit/cycles.md` under `shots/afterimage/cycle5/`; `python aikit.py check afterimage` green.

### ADR-019: Validate the saved daily result before it reaches the menu
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: A persisted daily result with a valid date but no score threw inside `renderDaily` during boot, so `/?mode=daily` stayed on the menu and never called `startRun`. The loader trusted any object stored under `afterimage.daily`.
- **Decision**: Add pure `sanitizeDailyResult`: accept only a valid date and finite non-negative score; default totals to 10, cap cleared at total, accuracy at 100, fall back to `WARMING UP` for non-string ratings, and coerce `won`. `loadDaily` uses it and also validates `last`; malformed records become `null` without touching unrelated saves. Bump the service-worker cache to `afterimage-v10`.
- **Consequences**: 63 tests pass (61 prior + 2 failing-first tests: sanitizer and loader). A corrupt save followed by `/?mode=daily` now starts and clears a full Daily #311 (5,570, 10/10, 100%, EAGLE EYE), repairs the record to a 4-day streak, and logs zero console errors. Before/after frames are recorded in `.aikit/cycles.md` under `shots/afterimage/cycle6/`; `python aikit.py check afterimage` green.

### ADR-020: Reveal the odd tile on a fatal miss
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: A wrong pick that spent the last life finished the run after 640ms with only `Out of focus`; unlike a timeout, it never showed the odd tile. A loss therefore taught the player nothing about the answer.
- **Decision**: Add pure `shouldRevealMiss(timed, lives)`; when it is true, reuse the timeout reveal overlay, paint immediately, say `Out of focus — it was there`, and hold the beat for 1150ms before the result. Nonfatal misses and untimed wrong picks keep the existing rhythm and no reveal. Bump the service-worker cache to `afterimage-v11`.
- **Consequences**: 64 tests pass (63 prior + 1 failing-first test with 4 assertions). A scripted three-miss Daily #311 run shows the reveal at 180ms (lives 0, reveal true), then ends at 0/10, 0%, `So close.` with one red board and zero console errors. Before/after frames are recorded in `.aikit/cycles.md` under `shots/afterimage/cycle7/`; `python aikit.py check afterimage` green.

### ADR-021: Give timeout, win and loss their own audio contours
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: A timeout reused the wrong-pick buzz (one 146Hz triangle), and the result screen was silent. With the same cue for a wrong pick and the clock running out, and no finish sting, the three outcomes were indistinguishable by ear.
- **Decision**: Add `soundTimeout` (descending 392→294→196Hz), `soundWin` (rising 523.25→659.25→783.99→1046.5Hz), and `soundLose` (220→164.81Hz). `timeout()` uses the timeout cue; `finish()` plays the win sting only when the run has at least one clear and the loss fall otherwise. Bump the service-worker cache to `afterimage-v12`.
- **Consequences**: 65 tests pass (64 prior + 1 failing-first oscillator-capture test with 7 assertions). Real-Chromium tone logs show the before timeout equal to the wrong buzz and no finish sting, while the after run logs the descending timeout, the loss fall after the fatal buzz, and the rising win arpeggio after the last correct tone. The Daily timeout/loss and Zen 10/10 runs both completed with zero console errors. Logs and frames are under `shots/afterimage/cycle8/`; `python aikit.py check afterimage` green.

### ADR-022: Let the weakest-type line own the Zen pointer
- **Date**: 2026-11-07
- **Status**: Accepted
- **Context**: A failed run's WARMING UP blurb told the player Zen was a good place to study, then the appended weakest-type sentence said the same thing again for the costliest type. The paragraph repeated itself instead of diagnosing once and pointing once.
- **Decision**: Change the WARMING UP base blurb to "Every miss is a calibration. Start with the bright, big boards and work down." Leave the weakest-type sentence as the only Zen practice pointer. Bump the service-worker cache to `afterimage-v13`.
- **Consequences**: 66 tests pass (65 prior + 1 failing-first copy test). The same three-miss Daily #311 result now reads one general cue plus "Hue boards cost you most — Zen is a good place to study them." zero console errors on both runs. Before/after frames are in `.aikit/cycles.md` under `shots/afterimage/cycle9/`; `python aikit.py check afterimage` green.

### ADR-023: Give the final board a persistent boss identity
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The last board of every run looked identical to every other board; only the transient status line said "final board", so the climax had no persistent visual identity.
- **Decision**: Add pure `isFinalBoard(level, total)`; the last level toggles a `.stage.finale` gold border/glow and an aria-hidden `FINAL BOARD` badge, while start/finish/menu/boot clear both. Bump the service-worker cache to `afterimage-v14`.
- **Consequences**: 68 tests pass (66 prior + 2 failing-first contracts: pure boundary test and shell/CSS/JS test). The same seeded Daily board-10 state (score 4,890) gains only the badge and glow in the after frame. A scripted 10-board run showed the badge and `finale` class only on board 10, cleared both on the result, and scored 10/10, 100%, 5,580 with zero console errors. Evidence is under `shots/afterimage/cycle10/`; `python aikit.py check afterimage` green.

### ADR-024: Rank daily results by completion before score
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A Daily run that cleared one board then lost showed `NEW DAILY BEST` at 270 points. The lost attempt became the stored benchmark, and a later lower-scoring win could not replace it, so a failure looked like the day's achievement.
- **Decision**: Add pure `dailyResultBeats(prior, score, won)`: no prior result always stores; a completed run outranks a loss regardless of score; within the same completion status the higher score wins; malformed scores never beat anything. `recordDaily` uses it, and the `NEW DAILY BEST` callout is gated on `won`. Bump the service-worker cache to `afterimage-v15`.
- **Consequences**: 69 tests pass (68 prior + 1 failing-first test with 8 assertions). The same Daily #312 loss (270, 1/10, 25%) no longer shows the badge; an immediate replay win at 5,580 shows it and replaces the stored result with `won: true`. The menu now prefers a completed run over a higher-scoring loss. Evidence is under `shots/afterimage/cycle11/`; `python aikit.py check afterimage` green.

### ADR-025: Tell the player when a score card cannot be saved
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: `saveScoreCard` silently returned when `renderScoreCard` produced an empty URL, leaving the Save card button unchanged with no explanation. A thrown export only left a permanent "Could not save" button label.
- **Decision**: Add pure `saveCardFeedback(url)` and a `role="status" aria-live="polite"` line in the result actions. Failed exports show `Card unavailable — Copy result still works.` and keep the button enabled; successful exports show `Download requested — check your downloads.` while the button reports `Saved`. The status clears on a new result or menu. Bump the service-worker cache to `afterimage-v16`.
- **Consequences**: 71 tests pass (69 prior + 2 failing-first tests: feedback copy and live-region contract). With a mocked empty canvas export, the before result screen gives no feedback and the after shows the error line; the normal export still reaches `Saved` with the download status and zero console errors. Evidence is under `shots/afterimage/cycle12/`; `python aikit.py check afterimage` green.

### ADR-026: Expose the share text when the clipboard fails
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: When both clipboard paths were blocked, Copy result showed a disabled `Copy failed` label, exposed no share text, and dropped focus to `BODY`. The player lost both the content and the keyboard position.
- **Decision**: Add pure `copyFeedback(copied)` and a hidden fallback panel with a read-only textarea. A blocked copy fills and selects the exact share text, focuses it, and labels the action `Copy blocked`; Close hides the panel and restores focus to Copy result. The copy button stays enabled, and the hidden-textarea path restores focus after removal. Bump the service-worker cache to `afterimage-v17`.
- **Consequences**: 73 tests pass (71 prior + 2 failing-first tests: feedback state and panel contract). The blocked flow exposes the exact 95-character share text with selection 0–95 and focuses `#copyText`; Close returns focus to `#copyResult`. The normal flow still reports `Copied`, hides the panel, and keeps focus on the button. Logs are under `shots/afterimage/cycle13/`; `python aikit.py check afterimage` green.

### ADR-027: Return menu focus to the primary Daily action
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: After keyboard activation of Change mode, the result overlay hid the focused button and the menu opened with `document.activeElement` on `BODY`. Keyboard users had to restart tabbing from the top of the page.
- **Decision**: `showMenu` focuses `#dailyBtn` with `preventScroll` after the menu content is rendered, covering both Change mode and Quit run. This is a focus-only change; no layout, copy or persisted state changes. Bump the service-worker cache to `afterimage-v18`.
- **Consequences**: 74 tests pass (73 prior + 1 failing-first shell contract). The played keyboard flow (four Tabs to Change mode, activate) now lands on `#dailyBtn` with `:focus-visible` true; the before log lands on `BODY` with no focus. Evidence is under `shots/afterimage/cycle14/`; `python aikit.py check afterimage` green.

### ADR-028: Move focus and the dialog label into the result card
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: Both loss and win result screens opened with `document.activeElement` on `BODY`, and the result veil kept `aria-labelledby="title"` while that menu heading was hidden. Keyboard focus and the dialog label both pointed away from the result.
- **Decision**: Make `#over` programmatically focusable (`tabindex="-1"`), focus it in `finish` with `preventScroll`, and set the veil label to `resultTitle`; `showMenu` restores `title`. The focused result card gets a purple border/glow so sighted keyboard users can see the active region. Bump the service-worker cache to `afterimage-v19`.
- **Consequences**: 75 tests pass (74 prior + 1 failing-first shell/DOM contract). Loss and won replay results both land on `#over` with `veilLabel: resultTitle`; the after frame shows the purple focus glow while the before frame is ordinary. Evidence is under `shots/afterimage/cycle15/`; `python aikit.py check afterimage` green.

### ADR-029: Restore grid focus after a nonfatal wrong pick
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The wrong-pick branch hides the grid while the focused cell is inside it, so focus falls to `BODY`. The play reset removes the hidden state but never restores focus, leaving keyboard users unable to arrow to the odd tile without tabbing from the page start. The installed-PWA offline lead was probed separately (warm and cold `/?mode=daily`) and already works, so it was recorded as a dead end.
- **Decision**: In the nonfatal wrong branch, after the pause, clear every cell's tab stop, set the picked cell to `tabIndex = 0`, and focus it with `preventScroll`. No scoring, layout or persisted-state changes. Bump the service-worker cache to `afterimage-v20`.
- **Consequences**: 76 tests pass (75 prior + 1 failing-first shell contract). The after build restores `activeIndex: "0"` with `:focus-visible` true, then two ArrowDowns and one ArrowRight reach the odd cell and Enter clears the board (level 1, 210 points); the before build ends at `BODY` with no recovery. Evidence is under `shots/afterimage/cycle16/`; `python aikit.py check afterimage` green.

### ADR-030: Put first-load focus on the Daily card
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: First load left `document.activeElement` on `BODY`; the first Tab reached the brand link behind the modal menu veil. Keyboard users began outside the dialog and could not start play directly. A synthetic score-card overflow probe found no clipping, so that lead was recorded as a dead end.
- **Decision**: Focus `#dailyBtn` with `preventScroll` in the boot block after the menu is shown. Change the Daily card’s focus styling from `:focus-visible` to `:focus` so the programmatic first-load focus is visible regardless of input modality. Bump the service-worker cache to `afterimage-v21`.
- **Consequences**: 77 tests pass (76 prior + 1 failing-first boot contract). With focus emulation matching a real window, first load reports `dailyBtn` with `focusVisible: true` and a white ring; Enter starts the Daily run and moves focus to cell 0. The before build starts on `BODY` and Tabs to the brand link. Evidence is under `shots/afterimage/cycle17/`; `python aikit.py check afterimage` green.

### ADR-031: Keep Tab focus inside the open dialog
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The veil declares `aria-modal="true"`, but Shift+Tab from the Daily card or from the result card moved focus to the SOUND button behind the overlay. Keyboard focus left the dialog entirely.
- **Decision**: Add `trapDialogFocus` on document keydown: while the veil is open, choose the visible card (`#over` or `#menu`), collect its visible focusable controls, and wrap Tab/Shift+Tab at the ends. Focus on the card itself or outside the card is redirected to the first/last control. Add visible `.btn`/`.copy` focus rings. Bump the service-worker cache to `afterimage-v22`.
- **Consequences**: 78 tests pass (77 prior + 1 failing-first trap contract). The before log shows `SOUND ON` outside both dialogs; the after log shows Onslaught inside the menu and Change mode inside the result, with Tab wrapping to Copy result. The keyboard run starts Daily, loses three lives, and navigates the result with zero console errors. Evidence is under `shots/afterimage/cycle18/`; `python aikit.py check afterimage` green.

### ADR-032: Only completed runs can set a mode personal best
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: A Blitz/Nightmare/Focus run that cleared one board then lost set a personal best and showed `NEW BEST` (320 / 650 / 270). A failed attempt could outrank a later completed run, mirroring the daily-best defect fixed in ADR-024.
- **Decision**: Add pure `bestEligible(won, timed, best)` and call `saveBest` / show `NEW BEST` only for a completed run in a timed best-bearing mode. Existing saved best values are left untouched, and no storage schema changes. Bump the service-worker cache to `afterimage-v23`.
- **Consequences**: 79 tests pass (78 prior + 1 failing-first test). The deterministic Blitz loss at 320 leaves `bests.blitz: 0` and hides the badge; a replay win at 7,040 saves the best and shows `NEW BEST`. Nightmare and Focus loss audits also hide the badge. Evidence is under `shots/afterimage/cycle19/`; `python aikit.py check afterimage` green.

### ADR-033: Version structured saves and refuse unknown future versions
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The project guideline requires persisted state to carry a format version and requires loaders to refuse versions they do not support without modifying the file. The structured saves had no version, so a future version-2 profile loaded as normal and the next hint save dropped the version and overwrote the file. The Onslaught repeated-run audit was a dead end: wins, losses, reloads and equal-score replays all persisted correctly.
- **Decision**: Add `SAVE_VERSION = 1` and `parseStoredObject`: versionless saves load as v1; a malformed or newer version blocks that key, and `store.set` refuses blocked keys. `afterimage.bests`, `.daily` and `.profile` writers stamp `version: 1`. Bump the service-worker cache to `afterimage-v24`.
- **Consequences**: 81 tests pass (79 prior + 2 failing-first tests: version stamping/legacy load and future refusal/no overwrite). A version-2 profile no longer appears in the menu and remains byte-identical after a hint save; legacy saves still load and are rewritten as v1. Evidence is under `shots/afterimage/cycle20/`; `python aikit.py check afterimage` green.

### ADR-034: Count an abandoned run in lifetime stats
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: Clearing two Focus boards then pressing Quit run returned to `EYE LV 1 · 0 clears · 0 runs`. Only the finished-result path updated profile runs, clears and bestStreak, so quitting erased the attempt and its cleared boards.
- **Decision**: Add pure `abandonedTotals` and a `quitRun` handler: a quit during play/pause/reveal adds one run, adds the run's cleared boards, keeps the maximum run streak, saves the versioned profile, then opens the menu. Change mode and the finished-result path remain unchanged, so a completed run is not double-counted. Bump the service-worker cache to `afterimage-v25`.
- **Consequences**: 82 tests pass (81 prior + 1 failing-first test). A two-clear quit stores `{runs:1, clears:2, bestStreak:2, version:1}`; a following Focus run with one clear then a loss adds exactly one run and one clear. Evidence is under `shots/afterimage/cycle21/`; `python aikit.py check afterimage` green.

### ADR-035: Never claim a best that a blocked save cannot persist
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: With a future-format `afterimage.bests`, a full Focus win mutated the in-memory best to 5,580 and showed `NEW BEST` while the raw file stayed version 2. After reload the best was gone, so the result screen had celebrated unpersisted data.
- **Decision**: `saveBest` returns false when `afterimage.bests` is blocked, before it mutates `state.bests` or writes. No result badge is shown for a best that cannot persist, and the future save remains byte-identical. Bump the service-worker cache to `afterimage-v26`.
- **Consequences**: 83 tests pass (82 prior + 1 failing-first test). The deterministic Focus win at 5,580 hides `NEW BEST`, leaves `state.bests.focus` at 0, keeps the version-2 raw file intact, and reloads to `CLEARED` only. Evidence is under `shots/afterimage/cycle22/`; `python aikit.py check afterimage` green.

### ADR-036: Make a blocked daily save read-only for the session
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: With a future-format `afterimage.daily`, a full daily win showed `NEW DAILY BEST` and updated the in-memory daily result/streak while the raw version-2 file stayed untouched. Reloading lost the result, so the game had claimed daily progress it could not persist.
- **Decision**: `recordDaily` returns early with `{isBest:false}` when `afterimage.daily` is blocked, leaving daily last/streak/result untouched and showing no daily-best callout. The future save is never written. Bump the service-worker cache to `afterimage-v27`.
- **Consequences**: 84 tests pass (83 prior + 1 failing-first test). The deterministic daily win at 5,580 hides `NEW DAILY BEST`, leaves `state.daily` at its defaults, keeps the version-2 raw file byte-identical, and reloads to a fresh daily. Evidence is under `shots/afterimage/cycle23/`; `python aikit.py check afterimage` green.

### ADR-037: A blocked profile save is read-only for the session
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: With a future-format `afterimage.profile`, a perfect daily win added “Streak freeze earned” and “First Daily clear!” and mutated in-memory freezes/runs/wins while the raw profile stayed version 2. Reloading lost the claims. The freeze earn/consume end-to-end audit itself was a dead end; the defect was the blocked-profile claim.
- **Decision**: Gate profile mutations on the key being writable: `finish` skips runs/clears/bestStreak/wins updates and the save, `quitRun` skips abandoned-run totals, `useHint` skips hintsUsed, and `earnFreeze` refuses before arming. The daily and bests saves remain independent. Bump the service-worker cache to `afterimage-v28`.
- **Consequences**: 85 tests pass (84 prior + 1 failing-first blocked-freeze test). With a version-2 profile, the perfect daily win hides the freeze and first-clear sentences, leaves the profile at defaults, keeps the raw profile byte-identical, and still records the valid daily result and 3-day streak. Evidence is under `shots/afterimage/cycle24/`; `python aikit.py check afterimage` green.

### ADR-038: Show whole seconds on the clock bar
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The only clock was a 3px bar with `aria-label="Time remaining"` and no value. Players could only estimate the remaining slice, and assistive technology had no current value.
- **Decision**: Add pure `timerLabel` and update a right-edge `data-time` readout plus `aria-label` only when the whole second changes. Untimed Zen clears both; the fill gets a radius so the bar can stop clipping the readout. Bump the service-worker cache to `afterimage-v29`.
- **Consequences**: 87 tests pass (85 prior + 2 failing-first tests: label formatting and shell/value contract). At 12,000ms the timer shows `12s` and an ARIA value of 12 seconds, then `11s` after a second; a wrong pick drops lives while the clock stays live. Evidence is under `shots/afterimage/cycle25/`; `python aikit.py check afterimage` green.

### ADR-039: Give the lives dots a visible count and an accessible value
- **Date**: 2026-11-08
- **Status**: Accepted
- **Context**: The Focus lives HUD was three unlabeled dots. Sighted players had to count 7px dots, and assistive technology received only the word “Focus” with no value.
- **Decision**: Add pure `livesLabel(timed, lives, maxLives)`; render a visible numeric count beside the dots and set the dots' ARIA label to `N of M focus remaining` (or `No focus limit` in Zen). Update both in `renderHud`. Bump the service-worker cache to `afterimage-v30`.
- **Consequences**: 89 tests pass (87 prior + 2 failing-first tests: label formatting and HUD contract). Focus starts at `Focus 3` / `3 of 3 focus remaining`; a wrong pick drops to `Focus 2` / `2 of 3 focus remaining` with two lit dots. Evidence is under `shots/afterimage/cycle26/`; `python aikit.py check afterimage` green.
