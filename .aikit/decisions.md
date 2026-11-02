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
