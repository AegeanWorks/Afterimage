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
