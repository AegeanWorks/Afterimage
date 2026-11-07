'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const GAME_PATH = path.join(__dirname, '..', 'game.js');

function createHarness(options = {}) {
  const storage = options.storage || (() => {
    const map = new Map();
    return {
      getItem(k) { return map.has(k) ? map.get(k) : null; },
      setItem(k, v) { map.set(k, String(v)); },
      removeItem(k) { map.delete(k); },
      clear() { map.clear(); }
    };
  })();

  const makeCtx = () => ({
    fillRect() {},
    clearRect() {},
    fillText() {},
    measureText: () => ({ width: 0 }),
    beginPath() {},
    arc() {},
    arcTo() {},
    roundRect() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    fill() {},
    stroke() {},
    strokeRect() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    setTransform() {},
    drawImage() {}
  });

  const makeEl = (id = '') => ({
    id,
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {}
    },
    addEventListener() {},
    setAttribute() {},
    hidden: false,
    getContext: makeCtx
  });

  const sandbox = {
    document: {
      getElementById: (id) => makeEl(id),
      querySelectorAll: () => [],
      addEventListener() {}
    },
    window: {
      location: { search: options.search || '' },
      addEventListener() {},
      clearTimeout() {},
      setTimeout() {},
      matchMedia: () => ({ matches: false }),
      localStorage: storage
    },
    localStorage: storage,
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    performance: { now: () => 0 },
    URLSearchParams,
    console,
    navigator: {}
  };

  const code = fs.readFileSync(GAME_PATH, 'utf8');
  vm.createContext(sandbox);

  const exported = vm.runInContext(
    code + '\n;({ SCRIPTS, MODES, WIN_TITLES, TYPE_LABEL, BOARD_CLASS, localDateKey, isValidDateKey, previousDateKey, dailyNumber, dailyDateLabel, hashString, mulberry32, makeRound, scoreFor, rateRun, buildShareText, comboTier, assistEase, easedDelta, loadProfile, loadDaily, sanitizeDailyResult, eyeLevel, profileLine, sparkColor, scorePopText, shouldRevealMiss, isAdjacent, firstRunTip, isFinalBoard, progressBeat, weakestType, bonusHints, onBestPace, hiddenPenalty, freezeRepair, dailyStreakAfter, dailyResultBeats, saveCardFeedback, copyFeedback, bestEligible, earnFreeze, bestLine, ensureAudio, soundWrong, soundTimeout, soundWin, soundLose })',
    sandbox
  );

  return {
    sandbox,
    ...exported
  };
}

module.exports = {
  createHarness
};
