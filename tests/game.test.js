'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createHarness } = require('./harness');

test('mulberry32 is deterministic and generates values in [0, 1)', () => {
  const { mulberry32 } = createHarness();
  const rng1 = mulberry32(12345);
  const rng2 = mulberry32(12345);

  const seq1 = [rng1(), rng1(), rng1(), rng1()];
  const seq2 = [rng2(), rng2(), rng2(), rng2()];

  assert.deepStrictEqual(seq1, seq2);
  for (const v of seq1) {
    assert.ok(v >= 0 && v < 1, `value ${v} must be in [0, 1)`);
  }
});

test('hashString hashes strings consistently into 32-bit integers', () => {
  const { hashString } = createHarness();
  const h1 = hashString('2026-10-31');
  const h2 = hashString('2026-10-31');
  const h3 = hashString('2026-11-01');

  assert.strictEqual(h1, h2);
  assert.notStrictEqual(h1, h3);
  assert.strictEqual(typeof h1, 'number');
});

test('daily date formatting and previous date arithmetic', () => {
  const { localDateKey, previousDateKey, dailyNumber, dailyDateLabel } = createHarness();

  const fixedDate = new Date(2026, 9, 31); // Month is 0-indexed: 9 = October
  const key = localDateKey(fixedDate);
  assert.strictEqual(key, '2026-10-31');

  const prev = previousDateKey(key);
  assert.strictEqual(prev, '2026-10-30');

  const monthRoll = previousDateKey('2026-03-01');
  assert.strictEqual(monthRoll, '2026-02-28');

  const num = dailyNumber(key);
  assert.ok(Number.isInteger(num) && num > 0);

  const label = dailyDateLabel('2026-10-31');
  assert.strictEqual(label, 'OCT 31');
});

test('calendar helpers reject malformed keys', () => {
  const { previousDateKey, dailyNumber, dailyDateLabel } = createHarness();

  // NOTE: harness runs game.js in vm, so cross-realm Error prototypes differ;
  // match by name/message instead of constructor identity.
  const isTypeError = (err) => err && err.name === 'TypeError' && /invalid date key/.test(err.message);
  assert.throws(() => previousDateKey(''), isTypeError);
  assert.throws(() => previousDateKey(null), isTypeError);
  assert.throws(() => previousDateKey('nope'), isTypeError);
  assert.throws(() => dailyNumber('nope'), isTypeError);
  assert.throws(() => dailyDateLabel('nope'), isTypeError);
  assert.throws(() => dailyDateLabel(''), isTypeError);
});

test('onBestPace guards degenerate totals', () => {
  const { onBestPace } = createHarness();

  assert.strictEqual(onBestPace(100, 5, 0, 2000), false);
  assert.strictEqual(onBestPace(9999, 11, 10, 2000), false);
  assert.strictEqual(onBestPace(100, 0, 0, 2000), false);
});

test('bestLine formats numeric strings with commas', () => {
  const { bestLine } = createHarness();

  assert.strictEqual(bestLine('2300', 0), 'BEST 2,300');
  assert.strictEqual(bestLine(2300, 0), 'BEST 2,300');
  assert.strictEqual(bestLine(-5, 0), '');
});

test('ensureAudio survives a throwing AudioContext', () => {
  const h = createHarness();
  h.sandbox.window.AudioContext = () => { throw new Error('blocked'); };

  assert.doesNotThrow(() => h.ensureAudio());
});

test('hiddenPenalty charges wall-clock hidden time', () => {
  const { hiddenPenalty } = createHarness();

  assert.strictEqual(hiddenPenalty(15000, 30000), 0);
  assert.strictEqual(hiddenPenalty(15000, 1000), 14000);
  assert.strictEqual(hiddenPenalty(15000, 0), 15000);
  assert.strictEqual(hiddenPenalty(15000, -500), 15000);
});

test('visibility handler does not credit hidden time', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');

  assert.ok(src.includes('hiddenAt'), 'visibility handler must track hidden start');
  assert.ok(src.includes('hiddenPenalty'), 'hidden time must go through wall-clock penalty');
});

test('isValidDateKey accepts real calendar dates only', () => {
  const { isValidDateKey } = createHarness();

  assert.strictEqual(isValidDateKey('2026-10-31'), true);
  assert.strictEqual(isValidDateKey('2024-02-29'), true);
  assert.strictEqual(isValidDateKey('2026-13-01'), false);
  assert.strictEqual(isValidDateKey('2026-02-30'), false);
  assert.strictEqual(isValidDateKey('nope'), false);
  assert.strictEqual(isValidDateKey(''), false);
  assert.strictEqual(isValidDateKey(null), false);
});

test('canvas uses roundRect fallback helper (no raw roundRect calls)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');

  assert.ok(src.includes('function traceRoundRect('), 'missing traceRoundRect helper');
  assert.ok(src.includes('arcTo'), 'fallback must use arcTo');
  const raw = src.match(/\.(roundRect)\s*\(/g) || [];
  // Only the helper itself may call the native method once.
  assert.ok(raw.length <= 1, `expected <=1 raw roundRect call, found ${raw.length}`);
});

test('nextLevel restores keyboard focus to the grid', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');

  assert.ok(src.includes('button.cell'), 'focus restore must target grid cells');
  assert.ok(src.includes('preventScroll'), 'focus restore must avoid scrolling');
});

test('buildShareText discloses hints used', () => {
  const { buildShareText } = createHarness();

  const hinted = buildShareText({ mode: 'focus', daily: false, won: true, cleared: 10, total: 10, accuracy: 91, score: 2000, rating: 'SHARP SIGHT', boards: [], hintsUsed: 1 });
  assert.ok(hinted.includes('1 hint'), 'hinted run must disclose hint');
  assert.ok(!hinted.includes('NO HINTS'), 'hinted run must not claim NO HINTS');

  const clean = buildShareText({ mode: 'focus', daily: false, won: true, cleared: 10, total: 10, accuracy: 100, score: 2000, rating: 'EAGLE EYE', boards: [] });
  assert.ok(clean.includes('NO HINTS') || !clean.includes('hint'), 'clean run keeps legacy proof line');
});

test('SCRIPTS configuration integrity', () => {
  const { SCRIPTS, TYPE_LABEL } = createHarness();

  assert.ok(Array.isArray(SCRIPTS.classic));
  assert.strictEqual(SCRIPTS.classic.length, 10);
  assert.ok(Array.isArray(SCRIPTS.nightmare));
  assert.strictEqual(SCRIPTS.nightmare.length, 8);

  for (const round of Object.values(SCRIPTS).flat()) {
    assert.ok(round.n >= 3 && round.n <= 10, `grid size ${round.n} must be between 3 and 10`);
    assert.ok(round.delta > 0, `delta ${round.delta} must be positive`);
    assert.ok(round.time > 0, `time ${round.time} must be positive`);
    assert.ok(Object.prototype.hasOwnProperty.call(TYPE_LABEL, round.type), `unknown round type ${round.type}`);
  }
});

test('MODES configuration integrity', () => {
  const { MODES } = createHarness();

  const requiredModes = ['focus', 'blitz', 'zen', 'nightmare', 'onslaught', 'daily'];
  for (const m of requiredModes) {
    assert.ok(Object.prototype.hasOwnProperty.call(MODES, m), `mode ${m} must exist`);
    const cfg = MODES[m];
    assert.strictEqual(typeof cfg.label, 'string');
    assert.strictEqual(typeof cfg.timed, 'boolean');
    assert.strictEqual(typeof cfg.lives, 'number');
    assert.strictEqual(typeof cfg.multiplier, 'number');
  }

  assert.strictEqual(MODES.focus.lives, 3);
  assert.strictEqual(MODES.blitz.lives, 2);
  assert.strictEqual(MODES.nightmare.lives, 1);
  assert.strictEqual(MODES.onslaught.lives, 2);
});

test('BOARD_CLASS maps result symbols to css classes', () => {
  const { BOARD_CLASS } = createHarness();
  assert.strictEqual(BOARD_CLASS['🟩'], 'ok');
  assert.strictEqual(BOARD_CLASS['🟨'], 'recovered');
  assert.strictEqual(BOARD_CLASS['🟥'], 'miss');
  assert.strictEqual(BOARD_CLASS['⬜'], 'skipped');
  assert.strictEqual(BOARD_CLASS['⬛'], 'unplayed');
});

test('makeRound creates valid boards with exactly one target odd tile', () => {
  const { makeRound, SCRIPTS } = createHarness();

  for (const def of SCRIPTS.classic) {
    const round = makeRound(def);
    assert.strictEqual(round.n, def.n);
    assert.strictEqual(round.def.type, def.type);
    assert.ok(round.odd >= 0 && round.odd < round.n * round.n);
    assert.ok(round.base.startsWith('hsl('));
    assert.ok(round.oddColor.startsWith('hsl('));
  }
});

test('scoreFor calculates points from remaining milliseconds and streak', () => {
  const { scoreFor } = createHarness();

  const scoreHighTime = scoreFor(10000, 0);
  const scoreWithStreak = scoreFor(10000, 3);
  const scoreLowTime = scoreFor(3000, 0);

  assert.ok(scoreHighTime > 0);
  assert.ok(scoreWithStreak > scoreHighTime, 'higher streak must yield higher score');
  assert.ok(scoreHighTime > scoreLowTime, 'more remaining time must yield higher score');
});

test('rateRun assigns accurate titles and rating thresholds', () => {
  const { rateRun } = createHarness();

  const perfectFocus = rateRun(true, 10, 10, 100, 'focus');
  assert.strictEqual(perfectFocus.rating, 'EAGLE EYE');

  const perfectBlitz = rateRun(true, 10, 10, 100, 'blitz');
  assert.strictEqual(perfectBlitz.rating, 'QUICK EYE');

  const perfectNightmare = rateRun(true, 8, 8, 100, 'nightmare');
  assert.strictEqual(perfectNightmare.rating, 'NIGHT VISION');

  const partialRun = rateRun(false, 5, 10, 70, 'focus');
  assert.ok(partialRun.rating.length > 0);
  assert.notStrictEqual(partialRun.rating, 'EAGLE EYE');
});

test('buildShareText formats share card text with result strip', () => {
  const { buildShareText } = createHarness();

  const result = {
    daily: false,
    mode: 'focus',
    won: true,
    cleared: 10,
    total: 10,
    accuracy: 100,
    score: 2300,
    rating: 'EAGLE EYE',
    boards: ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩']
  };

  const text = buildShareText(result);
  assert.ok(text.includes('Afterimage · Focus run · EAGLE EYE'));
  assert.ok(text.includes('2,300 · 10/10 · 100%'));
  assert.ok(text.includes('🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩'));
  assert.ok(text.includes("Find the tile that doesn't belong."));
});

test('comboTier escalates multiplier with streak', () => {
  const { comboTier } = createHarness();

  assert.strictEqual(comboTier(0).mult, 1);
  assert.strictEqual(comboTier(1).name, '');
  assert.strictEqual(comboTier(2).name, 'COMBO');
  assert.strictEqual(comboTier(4).name, 'FEVER');
  assert.strictEqual(comboTier(6).name, 'BLAZE');
  assert.ok(comboTier(6).mult > comboTier(4).mult);
  assert.ok(comboTier(4).mult > comboTier(2).mult);
});

test('assistEase and easedDelta ease boards after a slump', () => {
  const { assistEase, easedDelta } = createHarness();

  assert.strictEqual(assistEase(0), 1);
  assert.strictEqual(assistEase(1), 1);
  assert.strictEqual(assistEase(2), 1.3);

  const def = { type: 'hue', delta: 20 };
  assert.strictEqual(easedDelta(def, 1), 20);
  assert.ok(easedDelta(def, 1.3) > 20);
  assert.ok(easedDelta({ type: 'hue', delta: 39 }, 1.3) <= 40);
});

test('makeRound accepts an ease factor for comeback boards', () => {
  const { makeRound, SCRIPTS } = createHarness();

  const round = makeRound(SCRIPTS.classic[0], 1.3);
  assert.ok(round.odd >= 0 && round.odd < round.n * round.n);
  assert.ok(round.base.startsWith('hsl('));
});

test('scoreFor rewards perfect and surge boards without breaking monotonicity', () => {
  const { scoreFor } = createHarness();

  const base = scoreFor(10000, 3);
  const perfect = scoreFor(10000, 3, true);
  const surge = scoreFor(10000, 3, false, true);
  assert.ok(perfect > base, 'perfect board must pay more than a plain clear');
  assert.ok(surge > base, 'surge board must pay more than a plain board');
  assert.ok(scoreFor(10000, 3) > scoreFor(10000, 0), 'streak still pays more');
});

test('surge boards are scripted into classic and nightmare runs', () => {
  const { SCRIPTS } = createHarness();

  assert.ok(SCRIPTS.classic.some((round) => round.surge === true));
  assert.ok(SCRIPTS.nightmare.some((round) => round.surge === true));
});

test('late classic boards ramp harder than before (flow curve)', () => {
  const { SCRIPTS } = createHarness();

  const last = SCRIPTS.classic[SCRIPTS.classic.length - 1];
  assert.ok(last.delta <= 15, `final classic delta ${last.delta} must stay tight`);
  assert.ok(last.n >= 7, 'final board must stay large');
});

test('eyeLevel progresses every ten clears', () => {
  const { eyeLevel, loadProfile } = createHarness();

  assert.strictEqual(eyeLevel(0), 1);
  assert.strictEqual(eyeLevel(9), 1);
  assert.strictEqual(eyeLevel(10), 2);
  assert.strictEqual(eyeLevel(25), 3);

  const profile = loadProfile();
  assert.strictEqual(profile.runs, 0);
  assert.strictEqual(profile.clears, 0);
});

test('buildShareText appends combo and perfect proof when present', () => {
  const { buildShareText } = createHarness();

  const result = {
    daily: true,
    dailyNumber: 304,
    mode: 'focus',
    won: true,
    cleared: 10,
    total: 10,
    accuracy: 100,
    score: 5580,
    rating: 'EAGLE EYE',
    bestTier: 'BLAZE',
    bestStreak: 10,
    perfectBoards: 10,
    surgeBoards: 2,
    boards: ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩']
  };

  const text = buildShareText(result);
  assert.ok(text.includes('Afterimage Daily #304 · EAGLE EYE'));
  assert.ok(text.includes('5,580 · 10/10 · 100% · BLAZE ×10 · 10 perfects · 2 surges'));
});

test('buildShareText stays clean without combo fields (backward compat)', () => {  const { buildShareText } = createHarness();

  const result = {
    daily: false,
    mode: 'zen',
    won: true,
    cleared: 8,
    total: 10,
    accuracy: 80,
    score: 1200,
    rating: 'SHARP SIGHT',
    boards: ['🟩', '🟨', '🟩', '🟩', '🟩', '🟨', '🟩', '🟩', '⬜', '⬛']
  };

  const text = buildShareText(result);
  assert.ok(text.includes('1,200 · 8/10 · 80%'));
  assert.ok(!text.includes('×'));
  assert.ok(!text.includes('perfect'));
});

test('isAdjacent detects orthogonal neighbors without wrap', () => {
  const { isAdjacent } = createHarness();

  assert.ok(isAdjacent(4, 5, 6));
  assert.ok(isAdjacent(4, 5, 9));
  assert.ok(isAdjacent(4, 0, 1));
  assert.ok(!isAdjacent(4, 5, 5));
  assert.ok(!isAdjacent(4, 3, 4), 'row wrap is not adjacent');
  assert.ok(!isAdjacent(4, 0, 15), 'diagonal is not adjacent');
  assert.ok(!isAdjacent(4, 0, 5), 'two rows apart is not adjacent');
  assert.ok(isAdjacent(7, 48, 47));
});

test('firstRunTip coaches only the very first board', () => {
  const { firstRunTip } = createHarness();

  assert.strictEqual(firstRunTip(0, 0, 1), ' · press H for a hint');
  assert.strictEqual(firstRunTip(0, 1, 1), '');
  assert.strictEqual(firstRunTip(3, 0, 1), '');
  assert.strictEqual(firstRunTip(0, 0, 0), '');
});

test('progressBeat marks halfway, two-left and final boards', () => {
  const { progressBeat } = createHarness();

  assert.strictEqual(progressBeat(0, 10), '');
  assert.strictEqual(progressBeat(5, 10), ' · halfway');
  assert.strictEqual(progressBeat(8, 10), ' · two left');
  assert.strictEqual(progressBeat(9, 10), ' · final board');
  assert.strictEqual(progressBeat(4, 8), ' · halfway');
  assert.strictEqual(progressBeat(7, 8), ' · final board');
});

test('weakestType names the most-missed puzzle type', () => {
  const { weakestType } = createHarness();

  assert.strictEqual(weakestType({}), '');
  assert.strictEqual(weakestType(null), '');
  assert.strictEqual(weakestType({ rotate: 3, hue: 1 }), 'rotate');
  assert.strictEqual(weakestType({ hue: 2, sat: 2, light: 1 }), 'hue');
});

test('bonusHints rewards daily streaks of 3+ days', () => {
  const { bonusHints } = createHarness();

  assert.strictEqual(bonusHints(0), 0);
  assert.strictEqual(bonusHints(2), 0);
  assert.strictEqual(bonusHints(3), 1);
  assert.strictEqual(bonusHints(30), 1);
});

test('onBestPace compares prorated score against the target', () => {
  const { onBestPace } = createHarness();

  assert.strictEqual(onBestPace(0, 5, 10, 2000), false);
  assert.strictEqual(onBestPace(1000, 5, 10, 0), false);
  assert.strictEqual(onBestPace(1000, 5, 10, 2000), true);
  assert.strictEqual(onBestPace(999, 5, 10, 2000), false);
  assert.strictEqual(onBestPace(2000, 10, 10, 2000), true);
});

test('freezeRepair forgives exactly one missed day', () => {
  const { freezeRepair } = createHarness();

  assert.strictEqual(freezeRepair('2026-10-30', '2026-11-01'), true);
  assert.strictEqual(freezeRepair('2026-10-31', '2026-11-01'), false);
  assert.strictEqual(freezeRepair('2026-11-01', '2026-11-01'), false);
  assert.strictEqual(freezeRepair('2026-10-29', '2026-11-01'), false);
  assert.strictEqual(freezeRepair('2026-02-27', '2026-03-01'), true);
  assert.strictEqual(freezeRepair('', '2026-11-01'), false);
  assert.strictEqual(freezeRepair(null, '2026-11-01'), false);
});

test('earnFreeze grants one freeze for a perfect daily win', () => {
  const first = createHarness();

  assert.strictEqual(first.earnFreeze(true, 100), true);
  assert.strictEqual(first.earnFreeze(true, 100), false);

  const second = createHarness();
  assert.strictEqual(second.earnFreeze(false, 100), false);
  assert.strictEqual(second.earnFreeze(true, 99), false);
});

test('bestLine combines best score and cleared badge', () => {
  const { bestLine } = createHarness();

  assert.strictEqual(bestLine(0, 0), '');
  assert.strictEqual(bestLine(2300, 0), 'BEST 2,300');
  assert.strictEqual(bestLine(0, 2), 'CLEARED');
  assert.strictEqual(bestLine(2300, 1), 'BEST 2,300 · CLEARED');
});

test('loadProfile defaults wins per mode to zero', () => {
  const { loadProfile } = createHarness();

  const profile = loadProfile();
  for (const mode of ['focus', 'blitz', 'zen', 'nightmare', 'daily', 'onslaught']) {
    assert.strictEqual(profile.wins[mode], 0);
  }
});

test('onslaught script is a tight surge-heavy gauntlet', () => {
  const { SCRIPTS } = createHarness();

  assert.ok(Array.isArray(SCRIPTS.onslaught));
  assert.strictEqual(SCRIPTS.onslaught.length, 8);
  assert.ok(SCRIPTS.onslaught.filter((round) => round.surge === true).length >= 2);
  const last = SCRIPTS.onslaught[SCRIPTS.onslaught.length - 1];
  assert.ok(last.n >= 8, 'final onslaught board must stay large');
  assert.ok(last.delta <= 13, `final onslaught delta ${last.delta} must stay tight`);
});

test('onslaught mode configuration is reachable and bested', () => {
  const { MODES, loadProfile } = createHarness();

  assert.ok(Object.prototype.hasOwnProperty.call(MODES, 'onslaught'));
  const cfg = MODES.onslaught;
  assert.strictEqual(cfg.script, 'onslaught');
  assert.strictEqual(cfg.timed, true);
  assert.strictEqual(cfg.multiplier, 1.25);
  assert.strictEqual(cfg.best, true);
  assert.ok(loadProfile().wins.onslaught === 0);
});

test('onslaught boards generate deterministically from a seed', () => {
  const first = createHarness();
  const second = createHarness();

  // Seeded odd-position draw per board def: same seed -> identical sequence.
  const runSeq = (h) => {
    const rng = h.mulberry32(h.hashString('onslaught-probe'));
    return h.SCRIPTS.onslaught.map((def) => Math.floor(rng() * def.n * def.n));
  };
  const seqA = runSeq(first);
  const seqB = runSeq(second);
  assert.strictEqual(JSON.stringify(seqA), JSON.stringify(seqB)); // cross-realm: compare serialized
  assert.strictEqual(seqA.length, 8);
  seqA.forEach((odd, i) => {
    const n = first.SCRIPTS.onslaught[i].n;
    assert.ok(odd >= 0 && odd < n * n, `odd ${odd} must fit a ${n}x${n} board`);
  });
});

test('WIN_TITLES covers every playable mode (no undefined result title)', () => {
  const { MODES, WIN_TITLES } = createHarness();

  for (const mode of Object.keys(MODES)) {
    assert.ok(
      typeof WIN_TITLES[mode] === 'string' && WIN_TITLES[mode].length > 0,
      `WIN_TITLES missing ${mode} — clean win would render undefined`
    );
  }
});

test('buildShareText falls back to Focus on unknown mode (no throw)', () => {
  const { buildShareText } = createHarness();

  const text = buildShareText({ mode: 'nope', daily: false, won: true, cleared: 1, total: 1, accuracy: 100, score: 100, rating: 'X', boards: [] });
  assert.ok(text.includes('Afterimage · Focus run'), 'unknown mode must fall back to Focus label');
});
