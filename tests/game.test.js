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

test('SCRIPTS configuration integrity', () => {
  const { SCRIPTS, TYPE_LABEL } = createHarness();

  assert.ok(Array.isArray(SCRIPTS.classic));
  assert.strictEqual(SCRIPTS.classic.length, 10);
  assert.ok(Array.isArray(SCRIPTS.nightmare));
  assert.strictEqual(SCRIPTS.nightmare.length, 8);

  for (const round of [...SCRIPTS.classic, ...SCRIPTS.nightmare]) {
    assert.ok(round.n >= 3 && round.n <= 10, `grid size ${round.n} must be between 3 and 10`);
    assert.ok(round.delta > 0, `delta ${round.delta} must be positive`);
    assert.ok(round.time > 0, `time ${round.time} must be positive`);
    assert.ok(Object.prototype.hasOwnProperty.call(TYPE_LABEL, round.type), `unknown round type ${round.type}`);
  }
});

test('MODES configuration integrity', () => {
  const { MODES } = createHarness();

  const requiredModes = ['focus', 'blitz', 'zen', 'nightmare', 'daily'];
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
