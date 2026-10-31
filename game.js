"use strict";

/* Afterimage — a visual perception gauntlet.
 *
 * The puzzle exists only as pixels. Canvas paints the grid; the DOM carries
 * neutral hit areas labelled "Row N, column M", so the odd tile cannot be
 * recovered from markup, classes, or data attributes. A vision model has to
 * look at the board and click what it sees.
 */

const SCRIPTS = {
  classic: [
    { type: "hue",    n: 3, delta: 30, time: 15 },
    { type: "light",  n: 3, delta: 13, time: 15 },
    { type: "hue",    n: 4, delta: 23, time: 14 },
    { type: "sat",    n: 4, delta: 26, time: 14 },
    { type: "rotate", n: 4, delta: 30, time: 16 },
    { type: "light",  n: 5, delta: 9,  time: 16 },
    { type: "size",   n: 5, delta: 15, time: 16 },
    { type: "hue",    n: 6, delta: 16, time: 18 },
    { type: "rotate", n: 6, delta: 20, time: 20 },
    { type: "hue",    n: 7, delta: 20, time: 24 }
  ],
  nightmare: [
    { type: "hue",    n: 8,  delta: 18, time: 22 },
    { type: "light",  n: 8,  delta: 7,  time: 22 },
    { type: "sat",    n: 9,  delta: 15, time: 24 },
    { type: "rotate", n: 9,  delta: 16, time: 26 },
    { type: "size",   n: 9,  delta: 14, time: 24 },
    { type: "hue",    n: 10, delta: 13, time: 30 },
    { type: "light",  n: 10, delta: 6,  time: 30 },
    { type: "rotate", n: 10, delta: 12, time: 32 }
  ]
};

const TYPE_LABEL = {
  hue: "hue",
  light: "lightness",
  sat: "saturation",
  size: "size",
  rotate: "angle"
};

const BOARD_CLASS = {
  "🟩": "ok",
  "🟨": "recovered",
  "🟥": "miss",
  "⬜": "skipped",
  "⬛": "unplayed"
};

const MODES = {
  focus: {
    label: "Focus run",
    short: "Focus",
    timed: true,
    lives: 3,
    script: "classic",
    timeScale: 1,
    minTime: 1,
    multiplier: 1,
    best: true
  },
  blitz: {
    label: "Blitz",
    short: "Blitz",
    timed: true,
    lives: 2,
    script: "classic",
    timeScale: 0.55,
    minTime: 5,
    multiplier: 1.5,
    best: true
  },
  zen: {
    label: "Zen",
    short: "Zen",
    timed: false,
    lives: Infinity,
    script: "classic",
    timeScale: 1,
    minTime: 1,
    multiplier: 1,
    best: false
  },
  nightmare: {
    label: "Nightmare",
    short: "Nightmare",
    timed: true,
    lives: 1,
    script: "nightmare",
    timeScale: 1,
    minTime: 1,
    multiplier: 2,
    best: true
  },
  daily: {
    label: "Daily",
    short: "Daily",
    timed: true,
    lives: 3,
    script: "classic",
    timeScale: 1,
    minTime: 1,
    multiplier: 1,
    best: false,
    daily: true
  }
};

const WIN_TITLES = {
  focus: "Nice eyes.",
  blitz: "Fast eyes.",
  zen: "Zen complete.",
  nightmare: "Nightmare cleared.",
  daily: "Daily cleared."
};

const BESTS_KEY = "afterimage.bests";
const DAILY_KEY = "afterimage.daily";
const HUES = [198, 214, 246, 268, 292, 330, 12, 38, 154, 174];
const TAU = Math.PI * 2;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode — the game still runs */
    }
  }
};

function loadBests() {
  let saved = {};
  try {
    saved = JSON.parse(store.get(BESTS_KEY, "{}")) || {};
  } catch {
    saved = {};
  }

  const bests = { focus: 0, blitz: 0, nightmare: 0 };
  Object.keys(bests).forEach((mode) => {
    const value = Number(saved[mode]);
    if (Number.isFinite(value) && value > 0) bests[mode] = value;
  });

  const legacy = Number(store.get("afterimage.best", "0")) || 0;
  if (legacy > bests.focus) bests.focus = legacy;
  return bests;
}

/* ------------------------------------------------------------ daily calendar */

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

function dailyNumber(key) {
  const [year, month, day] = key.split("-").map(Number);
  const start = Date.UTC(2026, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.max(1, Math.floor((current - start) / 86400000) + 1);
}

function dailyDateLabel(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadDaily() {
  let saved = {};
  try {
    saved = JSON.parse(store.get(DAILY_KEY, "{}")) || {};
  } catch {
    saved = {};
  }
  return {
    last: typeof saved.last === "string" ? saved.last : "",
    streak: Number(saved.streak) > 0 ? Math.floor(Number(saved.streak)) : 0,
    result: saved.result && typeof saved.result === "object" ? saved.result : null
  };
}

function saveDaily() {
  store.set(DAILY_KEY, JSON.stringify(state.daily));
}

function currentStreak() {
  const today = localDateKey();
  const yesterday = previousDateKey(today);
  if (state.daily.last === today || state.daily.last === yesterday) {
    return state.daily.streak;
  }
  return 0;
}

const ui = {
  stage: document.getElementById("stage"),
  canvas: document.getElementById("board"),
  cells: document.getElementById("cells"),
  timer: document.getElementById("timer"),
  timerFill: document.getElementById("timerFill"),
  status: document.getElementById("status"),
  hud: document.getElementById("hud"),
  modeName: document.getElementById("modeName"),
  level: document.getElementById("levelNum"),
  levelTotal: document.getElementById("levelTotal"),
  score: document.getElementById("scoreNum"),
  lives: document.getElementById("livesNum"),
  streak: document.getElementById("streakNum"),
  sound: document.getElementById("soundBtn"),
  veil: document.getElementById("veil"),
  menu: document.getElementById("menu"),
  over: document.getElementById("over"),
  dailyBtn: document.getElementById("dailyBtn"),
  dailyKicker: document.getElementById("dailyKicker"),
  dailySub: document.getElementById("dailySub"),
  dailyAction: document.getElementById("dailyAction"),
  metaStreak: document.getElementById("metaStreak"),
  boardStrip: document.getElementById("boardStrip"),
  copyResult: document.getElementById("copyResult"),
  skip: document.getElementById("skipBtn"),
  quit: document.getElementById("quitBtn"),
  resultKicker: document.getElementById("resultKicker"),
  resultTitle: document.getElementById("resultTitle"),
  resultScore: document.getElementById("resultScore"),
  resultRating: document.getElementById("resultRating"),
  resultBlurb: document.getElementById("resultBlurb"),
  resultMode: document.getElementById("resultMode"),
  statCleared: document.getElementById("statCleared"),
  statAccuracy: document.getElementById("statAccuracy"),
  statStreak: document.getElementById("statStreak"),
  newBest: document.getElementById("newBest"),
  playAgain: document.getElementById("playAgain"),
  saveCard: document.getElementById("saveCard"),
  changeMode: document.getElementById("changeMode")
};

const ctx = ui.canvas.getContext("2d");

const state = {
  mode: "focus",
  timed: true,
  phase: "menu",
  runId: 0,
  levels: SCRIPTS.classic,
  level: 0,
  cleared: 0,
  skipped: 0,
  score: 0,
  lives: 3,
  maxLives: 3,
  multiplier: 1,
  streak: 0,
  bestStreak: 0,
  attempts: 0,
  hits: 0,
  levelMistakes: 0,
  boards: [],
  timeLimit: 1,
  remaining: 0,
  n: 3,
  odd: -1,
  data: null,
  rects: [],
  hover: -1,
  wrongFlash: -1,
  reveal: false,
  particles: [],
  lastFrame: 0,
  muted: store.get("afterimage.muted", "0") === "1",
  bests: loadBests(),
  daily: loadDaily(),
  rng: null,
  dailyKey: "",
  dailyNumber: 0,
  dailyDateLabel: "",
  result: null
};

let raf = 0;
let audio = null;

/* ------------------------------------------------------------------ audio */

function ensureAudio() {
  if (!audio) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audio = new Ctor();
  }
  if (audio && audio.state === "suspended") audio.resume();
}

function tone(freq, duration, type, gain, delay = 0) {
  if (state.muted || !audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function soundCorrect() {
  tone(620, 0.09, "sine", 0.045);
  tone(930, 0.16, "sine", 0.038, 0.07);
}

function soundWrong() {
  tone(146, 0.2, "triangle", 0.05);
}

/* --------------------------------------------------------------- round art */

function random() {
  return state.rng ? state.rng() : Math.random();
}

function makeRound(def) {
  const n = def.n;
  const odd = Math.floor(random() * n * n);
  const hue = HUES[Math.floor(random() * HUES.length)];
  const round = {
    def,
    n,
    odd,
    base: "",
    oddColor: "",
    oddAngle: 0,
    oddScale: 1
  };

  switch (def.type) {
    case "hue": {
      const direction = random() < 0.5 ? -1 : 1;
      round.base = `hsl(${hue} 68% 58%)`;
      round.oddColor = `hsl(${hue + direction * def.delta} 68% 58%)`;
      break;
    }
    case "light": {
      const direction = random() < 0.5 ? -1 : 1;
      round.base = `hsl(${hue} 62% 54%)`;
      round.oddColor = `hsl(${hue} 62% ${54 + direction * def.delta}%)`;
      break;
    }
    case "sat": {
      round.base = `hsl(${hue} 72% 60%)`;
      round.oddColor = `hsl(${hue} ${72 - def.delta}% 60%)`;
      break;
    }
    case "size": {
      round.base = `hsl(${hue} 74% 62%)`;
      round.oddColor = round.base;
      const direction = random() < 0.5 ? -1 : 1;
      round.oddScale = 1 + (direction * def.delta) / 100;
      break;
    }
    case "rotate": {
      round.base = `hsl(${hue} 72% 62%)`;
      round.oddColor = round.base;
      const direction = random() < 0.5 ? -1 : 1;
      round.oddAngle = (direction * def.delta * Math.PI) / 180;
      break;
    }
    default:
      round.base = `hsl(${hue} 68% 58%)`;
      round.oddColor = `hsl(${hue + 24} 68% 58%)`;
  }

  return round;
}

/* --------------------------------------------------------------- geometry */

function computeLayout() {
  if (!state.data) return;

  const size = Math.max(160, Math.round(ui.stage.clientWidth));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const pixels = Math.round(size * dpr);

  if (ui.canvas.width !== pixels || ui.canvas.height !== pixels) {
    ui.canvas.width = pixels;
    ui.canvas.height = pixels;
  }

  const n = state.n;
  const pad = size * 0.058;
  const gap = size * 0.017;
  const cell = (size - pad * 2 - gap * (n - 1)) / n;

  const rects = [];
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      rects.push({
        x: pad + col * (cell + gap),
        y: pad + row * (cell + gap),
        w: cell,
        h: cell
      });
    }
  }
  state.rects = rects;

  ui.cells.textContent = "";
  rects.forEach((tile, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.dataset.i = String(index);
    button.style.left = `${tile.x}px`;
    button.style.top = `${tile.y}px`;
    button.style.width = `${tile.w}px`;
    button.style.height = `${tile.h}px`;
    button.setAttribute(
      "aria-label",
      `Row ${Math.floor(index / n) + 1}, column ${(index % n) + 1}`
    );
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener("click", () => pick(index));
    button.addEventListener("mouseenter", () => {
      state.hover = index;
    });
    button.addEventListener("mouseleave", () => {
      if (state.hover === index) state.hover = -1;
    });
    button.addEventListener("focus", () => {
      state.hover = index;
    });
    button.addEventListener("blur", () => {
      if (state.hover === index) state.hover = -1;
    });
    ui.cells.appendChild(button);
  });
}

/* --------------------------------------------------------------- painting */

function paintTile(tile, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(tile.x, tile.y, tile.w, tile.h, tile.w * 0.22);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function paintDot(tile, color, scale) {
  const cx = tile.x + tile.w / 2;
  const cy = tile.y + tile.h / 2;
  const radius = tile.w * 0.3 * scale;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  ctx.beginPath();
  ctx.arc(cx - radius * 0.26, cy - radius * 0.3, radius * 0.36, 0, TAU);
  ctx.fill();
}

function paintPill(tile, color, angle) {
  const width = tile.w * 0.64;
  const height = tile.w * 0.235;
  ctx.save();
  ctx.translate(tile.x + tile.w / 2, tile.y + tile.h / 2);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, height / 2);
  ctx.fill();
  ctx.restore();
}

function paintHover(tile) {
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(tile.x + 1.5, tile.y + 1.5, tile.w - 3, tile.h - 3, tile.w * 0.2);
  ctx.stroke();
}

function paintWrong(tile) {
  ctx.fillStyle = "rgba(255,92,116,0.34)";
  ctx.beginPath();
  ctx.roundRect(tile.x, tile.y, tile.w, tile.h, tile.w * 0.22);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,92,116,0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function paintParticles() {
  if (!state.particles.length) return;
  ctx.save();
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function paint() {
  if (!state.data || !state.rects.length) return;

  const size = ui.stage.clientWidth;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const round = state.data;
  const now = performance.now();

  state.rects.forEach((tile, index) => {
    const isOdd = index === round.odd;
    const color = isOdd ? round.oddColor : round.base;

    if (round.def.type === "rotate") {
      paintPill(tile, color, isOdd ? round.oddAngle : 0);
    } else if (round.def.type === "size") {
      paintDot(tile, color, isOdd ? round.oddScale : 1);
    } else {
      paintTile(tile, color);
    }

    if (state.hover === index && state.phase === "play") paintHover(tile);
    if (state.wrongFlash === index) paintWrong(tile);
  });

  if (state.reveal) {
    ctx.fillStyle = "rgba(5,5,9,0.62)";
    ctx.fillRect(0, 0, size, size);
    const tile = state.rects[round.odd];
    const pulse = 0.62 + Math.sin(now / 170) * 0.26;
    ctx.strokeStyle = `rgba(255,255,255,${pulse.toFixed(3)})`;
    ctx.lineWidth = Math.max(2, size * 0.004);
    ctx.beginPath();
    ctx.roundRect(tile.x + 2, tile.y + 2, tile.w - 4, tile.h - 4, tile.w * 0.2);
    ctx.stroke();
  }

  paintParticles();
}

/* ------------------------------------------------------------------- hud */

function say(message) {
  ui.status.textContent = message;
}

function renderHud() {
  ui.modeName.textContent = MODES[state.mode].short;
  ui.level.textContent = String(Math.min(state.level + 1, state.levels.length)).padStart(2, "0");
  ui.levelTotal.textContent = `/${state.levels.length}`;
  ui.score.textContent = state.score.toLocaleString("en-US");
  ui.streak.textContent = String(state.streak);
  ui.lives.textContent = "";

  if (!state.timed) return;
  for (let i = 0; i < state.maxLives; i += 1) {
    const dot = document.createElement("i");
    dot.className = i < state.lives ? "life" : "life off";
    ui.lives.appendChild(dot);
  }
}

function updateTimer() {
  if (!state.timed) {
    ui.timerFill.style.transform = "scaleX(0)";
    return;
  }
  const ratio = Math.max(0, Math.min(1, state.remaining / state.timeLimit));
  ui.timerFill.style.transform = `scaleX(${ratio})`;
  ui.timer.classList.toggle("low", ratio < 0.25);
}

function renderBests() {
  document.querySelectorAll("[data-best]").forEach((node) => {
    const value = state.bests[node.dataset.best] || 0;
    node.textContent = value > 0 ? `BEST ${value.toLocaleString("en-US")}` : "";
    node.hidden = value <= 0;
  });
}

function renderDaily() {
  const today = localDateKey();
  const number = dailyNumber(today);
  const label = dailyDateLabel(today);
  ui.dailyKicker.textContent = `DAILY #${number} · ${label}`;

  const result = state.daily.result && state.daily.result.date === today ? state.daily.result : null;
  if (result) {
    ui.dailySub.textContent = `Played today · ${result.score.toLocaleString("en-US")} · ${result.rating}`;
    ui.dailyAction.textContent = "REPLAY →";
  } else {
    ui.dailySub.textContent = "A fresh seeded set · 10 boards · 3 lives";
    ui.dailyAction.textContent = "PLAY →";
  }

  const streak = currentStreak();
  ui.metaStreak.textContent = streak > 0 ? `${streak}-day streak` : "Day one";
}

function renderBoardStrip(icons) {
  ui.boardStrip.textContent = "";
  icons.forEach((icon) => {
    const dot = document.createElement("span");
    dot.className = BOARD_CLASS[icon] || "unplayed";
    ui.boardStrip.appendChild(dot);
  });
}

function renderSound() {
  ui.sound.textContent = state.muted ? "SOUND OFF" : "SOUND ON";
  ui.sound.setAttribute("aria-pressed", String(!state.muted));
}

/* ------------------------------------------------------------------ flow */

function startRun(mode) {
  const config = MODES[mode];
  if (!config) return;

  state.runId += 1;
  state.mode = mode;
  state.timed = config.timed;
  state.levels = SCRIPTS[config.script];

  const daily = Boolean(config.daily);
  state.dailyKey = daily ? localDateKey() : "";
  state.dailyNumber = daily ? dailyNumber(state.dailyKey) : 0;
  state.dailyDateLabel = daily ? dailyDateLabel(state.dailyKey) : "";
  state.rng = daily ? mulberry32(hashString(`afterimage-daily-${state.dailyKey}`)) : null;
  state.level = 0;
  state.cleared = 0;
  state.skipped = 0;
  state.score = 0;
  state.lives = config.lives;
  state.maxLives = config.lives;
  state.multiplier = config.multiplier;
  state.streak = 0;
  state.bestStreak = 0;
  state.attempts = 0;
  state.hits = 0;
  state.levelMistakes = 0;
  state.boards = [];
  state.data = null;
  state.odd = -1;
  state.remaining = 0;
  state.phase = "play";
  state.reveal = false;
  state.wrongFlash = -1;
  state.hover = -1;
  state.particles = [];
  state.result = null;

  document.body.classList.add("playing");
  document.body.classList.toggle("zen", mode === "zen");
  ui.veil.hidden = true;
  ui.hud.hidden = false;
  ui.menu.hidden = true;
  ui.over.hidden = true;
  ui.skip.hidden = mode !== "zen";
  ui.quit.hidden = false;
  ui.cells.classList.remove("off");

  ensureAudio();
  nextLevel();
}

function nextLevel() {
  if (state.level >= state.levels.length) {
    finish(true);
    return;
  }

  const def = state.levels[state.level];
  const config = MODES[state.mode];
  const seconds = Math.max(config.minTime, Math.round(def.time * config.timeScale));

  state.n = def.n;
  state.data = makeRound(def);
  state.odd = state.data.odd;
  state.timeLimit = seconds * 1000;
  state.remaining = state.timeLimit;
  state.phase = "play";
  state.hover = -1;
  state.wrongFlash = -1;
  state.reveal = false;
  state.levelMistakes = 0;
  state.particles = [];

  computeLayout();
  renderHud();
  updateTimer();
  paint();
  ui.cells.classList.remove("off");
  say(`Level ${state.level + 1} · ${TYPE_LABEL[def.type]} — find the one that differs.`);

  state.lastFrame = performance.now();
  ensureLoop();
}

function pick(index) {
  if (state.phase !== "play" || !state.data) return;
  const runId = state.runId;

  if (index === state.odd) {
    state.attempts += 1;
    state.hits += 1;
    state.cleared += 1;
    state.boards.push(state.levelMistakes === 0 ? "🟩" : "🟨");
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);

    const gain = scoreFor(state.remaining, state.streak);
    state.score += gain;
    state.phase = "pause";
    ui.cells.classList.add("off");

    const tile = state.rects[index];
    burst(tile.x + tile.w / 2, tile.y + tile.h / 2, state.data.oddColor);
    soundCorrect();
    const tail = state.streak > 1 ? ` · ${state.streak} in a row` : "";
    say(`Correct · +${gain}${tail}`);
    renderHud();

    window.setTimeout(() => {
      if (runId !== state.runId) return;
      advance();
    }, REDUCED ? 380 : 680);
    return;
  }

  state.attempts += 1;
  state.streak = 0;
  state.levelMistakes += 1;
  state.wrongFlash = index;
  state.phase = "pause";
  ui.cells.classList.add("off");
  shake();
  soundWrong();

  if (state.timed) {
    state.lives = Math.max(0, state.lives - 1);
    say(state.lives > 0 ? `Not that one · ${state.lives} focus left` : "Out of focus");
  } else {
    say("Not that one — scan again");
  }
  renderHud();

  window.setTimeout(() => {
    if (runId !== state.runId) return;
    state.wrongFlash = -1;
    if (state.timed && state.lives <= 0) {
      state.boards.push("🟥");
      finish(false);
      return;
    }
    state.phase = "play";
    ui.cells.classList.remove("off");
    state.lastFrame = performance.now();
    ensureLoop();
  }, REDUCED ? 400 : 640);
}

function timeout() {
  if (state.phase !== "play") return;
  const runId = state.runId;

  state.phase = "reveal";
  state.attempts += 1;
  state.streak = 0;
  state.boards.push("🟥");
  state.reveal = true;
  state.hover = -1;
  ui.cells.classList.add("off");
  soundWrong();

  if (state.timed) {
    state.lives = Math.max(0, state.lives - 1);
    say(state.lives > 0 ? "Time — here it was" : "Time — out of focus");
  }
  renderHud();
  paint();

  window.setTimeout(() => {
    if (runId !== state.runId) return;
    if (state.timed && state.lives <= 0) {
      finish(false);
      return;
    }
    advance();
  }, 1150);
}

function advance() {
  state.level += 1;
  if (state.level >= state.levels.length) {
    finish(true);
    return;
  }
  nextLevel();
}

function scoreFor(remaining, streak) {
  const speed = state.timed ? Math.round(Math.max(0, remaining) / 1000) * 8 : 40;
  const streakBonus = Math.min(120, Math.max(0, streak - 1) * 30);
  const base = 100 + speed + streakBonus;
  return Math.round((base * state.multiplier) / 10) * 10;
}

function rateRun(won, cleared, total, accuracy, mode) {
  const perfect = won && cleared === total && accuracy >= 85;
  const near = won && cleared >= total - 1;

  if (perfect && mode === "nightmare") {
    return {
      rating: "NIGHT VISION",
      blurb: "Eight brutal boards, one life, and you never blinked."
    };
  }
  if (perfect && mode === "blitz") {
    return {
      rating: "QUICK EYE",
      blurb: "Half the clock and you still caught every board. Show-off."
    };
  }
  if (perfect) {
    return {
      rating: "EAGLE EYE",
      blurb: "Nearly every difference at first glance. That is a rare eye."
    };
  }
  if (near) {
    return {
      rating: "SHARP SIGHT",
      blurb: "A strong run. Most eyes lose the thread on the last two boards."
    };
  }
  if (cleared >= total * 0.7) {
    return {
      rating: "CLEAR VISION",
      blurb: "Strong perception. The high boards reward a slower, wider scan."
    };
  }
  if (cleared >= total * 0.4) {
    return {
      rating: "STEADY GAZE",
      blurb: "You catch the big shifts. The subtle ones still have somewhere to hide."
    };
  }
  return {
    rating: "WARMING UP",
    blurb: "Every miss is a calibration. Zen mode is a good place to study the boards."
  };
}

function saveBest(mode, score) {
  if (!MODES[mode] || !MODES[mode].best) return false;
  if (score <= (state.bests[mode] || 0)) return false;
  state.bests[mode] = score;
  store.set(BESTS_KEY, JSON.stringify(state.bests));
  return true;
}

function recordDaily(won, accuracy, rating) {
  const day = state.dailyKey || localDateKey();
  const yesterday = previousDateKey(day);

  if (state.daily.last !== day) {
    state.daily.streak = state.daily.last === yesterday ? state.daily.streak + 1 : 1;
    state.daily.last = day;
  }

  const prior = state.daily.result && state.daily.result.date === day ? state.daily.result : null;
  const isBest = !prior || state.score > prior.score;
  if (isBest) {
    state.daily.result = {
      date: day,
      score: state.score,
      cleared: state.cleared,
      total: state.levels.length,
      accuracy,
      rating,
      won
    };
  }

  saveDaily();
  return { isBest, streak: state.daily.streak };
}

function finish(won) {
  state.runId += 1;
  state.phase = "over";
  document.body.classList.remove("playing");
  ui.cells.classList.add("off");
  ui.hud.hidden = true;
  ui.skip.hidden = true;
  ui.quit.hidden = true;

  const total = state.levels.length;
  const attempts = Math.max(1, state.attempts);
  const accuracy = Math.round((state.hits / attempts) * 100);
  const boardIcons = state.boards.slice(0, total);
  while (boardIcons.length < total) boardIcons.push("⬛");
  const info = rateRun(won, state.cleared, total, accuracy, state.mode);
  const clean = state.skipped === 0 && state.cleared === total;
  const config = MODES[state.mode];
  const isDaily = Boolean(config.daily);
  let isBest = false;

  if (isDaily) {
    const record = recordDaily(won, accuracy, info.rating);
    isBest = record.isBest && state.score > 0;
  } else {
    isBest = Boolean(state.timed && config.best && saveBest(state.mode, state.score));
  }

  state.result = {
    mode: state.mode,
    won,
    score: state.score,
    cleared: state.cleared,
    total,
    accuracy,
    bestStreak: state.bestStreak,
    boards: boardIcons,
    isBest,
    rating: info.rating,
    daily: isDaily,
    dailyNumber: isDaily ? state.dailyNumber : 0,
    dailyLabel: isDaily ? state.dailyDateLabel : ""
  };

  ui.resultKicker.textContent = isDaily
    ? `DAILY #${state.dailyNumber} · ${won ? "COMPLETE" : "RUN OVER"}`
    : (won ? "RUN COMPLETE" : "FOCUS LOST");
  ui.resultTitle.textContent = won
    ? (clean ? WIN_TITLES[state.mode] : "Run finished.")
    : "So close.";
  ui.resultScore.textContent = state.score.toLocaleString("en-US");
  ui.resultRating.textContent = info.rating;
  ui.resultBlurb.textContent = info.blurb;
  ui.resultMode.textContent = isDaily
    ? `Daily #${state.dailyNumber} · ${state.dailyDateLabel} · ${total} boards · ${state.maxLives} lives`
    : config.timed
      ? `${config.label} · ${total} boards · ${state.maxLives} ${state.maxLives === 1 ? "life" : "lives"}`
      : `${config.label} · ${total} boards · no clock`;
  ui.statCleared.textContent = `${state.cleared}/${total}`;
  ui.statAccuracy.textContent = `${accuracy}%`;
  ui.statStreak.textContent = String(state.bestStreak);
  ui.newBest.textContent = isDaily ? "New daily best" : "New best";
  ui.newBest.hidden = !isBest;
  ui.saveCard.disabled = false;
  ui.saveCard.textContent = "Save card";
  ui.copyResult.textContent = "Copy result";
  ui.copyResult.disabled = false;

  renderBoardStrip(boardIcons);
  renderBests();
  renderDaily();
  ui.menu.hidden = true;
  ui.over.hidden = false;
  ui.veil.hidden = false;
}

function showMenu() {
  state.runId += 1;
  state.phase = "menu";
  state.data = null;
  state.result = null;
  document.body.classList.remove("playing", "zen");
  ui.cells.classList.add("off");
  ui.veil.hidden = false;
  ui.menu.hidden = false;
  ui.over.hidden = true;
  ui.hud.hidden = true;
  ui.skip.hidden = true;
  ui.quit.hidden = true;
  renderBests();
  renderDaily();
}

function shake() {
  ui.stage.classList.remove("shake");
  void ui.stage.offsetWidth;
  ui.stage.classList.add("shake");
}

/* -------------------------------------------------------------- particles */

function burst(x, y, color) {
  if (REDUCED) return;
  for (let i = 0; i < 26; i += 1) {
    const angle = Math.random() * TAU;
    const speed = 40 + Math.random() * 230;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 1.5 + Math.random() * 2.5,
      color
    });
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.life -= dt * 1.6;
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    particle.vy += 520 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.985;
  }
}

/* --------------------------------------------------------------- score card */

function trackedWidth(g, text, spacing) {
  let width = 0;
  for (const character of text) width += g.measureText(character).width + spacing;
  return Math.max(0, width - spacing);
}

function drawTracked(g, text, x, y, spacing) {
  let cursor = x;
  for (const character of text) {
    g.fillText(character, cursor, y);
    cursor += g.measureText(character).width + spacing;
  }
}

function drawTrackedCentered(g, text, cx, y, spacing) {
  drawTracked(g, text, cx - trackedWidth(g, text, spacing) / 2, y, spacing);
}

function drawCardBoard(g, x, y) {
  const n = 5;
  const cell = 62;
  const gap = 12;
  const span = n * cell + (n - 1) * gap;

  const glow = g.createRadialGradient(
    x + span / 2, y + span / 2, 20,
    x + span / 2, y + span / 2, span * 0.75
  );
  glow.addColorStop(0, "rgba(139,124,255,0.20)");
  glow.addColorStop(1, "rgba(139,124,255,0)");
  g.fillStyle = glow;
  g.fillRect(x - 90, y - 90, span + 180, span + 180);

  g.fillStyle = "rgba(255,255,255,0.025)";
  g.strokeStyle = "rgba(255,255,255,0.08)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.roundRect(x - 22, y - 22, span + 44, span + 44, 30);
  g.fill();
  g.stroke();

  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      const tx = x + col * (cell + gap);
      const ty = y + row * (cell + gap);
      const odd = row === 1 && col === 3;
      g.fillStyle = odd ? "#4fd1c5" : "#6a59dd";
      g.beginPath();
      g.roundRect(tx, ty, cell, cell, 16);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.07)";
      g.lineWidth = 1;
      g.stroke();
    }
  }

  g.fillStyle = "#6f6f88";
  g.font = '700 11px "Segoe UI", system-ui, sans-serif';
  drawTrackedCentered(g, "CAN YOU SEE IT?", x + span / 2, y + span + 58, 2.4);
}

function renderScoreCard(result) {
  const width = 1200;
  const height = 630;
  const card = document.createElement("canvas");
  card.width = width;
  card.height = height;
  const g = card.getContext("2d");
  if (!g) return "";
  const mode = MODES[result.mode] || MODES.focus;

  const background = g.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#0c0c18");
  background.addColorStop(0.55, "#08080f");
  background.addColorStop(1, "#0d0a16");
  g.fillStyle = background;
  g.fillRect(0, 0, width, height);

  let glow = g.createRadialGradient(950, 90, 0, 950, 90, 520);
  glow.addColorStop(0, "rgba(139,124,255,0.34)");
  glow.addColorStop(1, "rgba(139,124,255,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, width, height);

  glow = g.createRadialGradient(160, 640, 0, 160, 640, 460);
  glow.addColorStop(0, "rgba(79,209,197,0.16)");
  glow.addColorStop(1, "rgba(79,209,197,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, width, height);

  g.strokeStyle = "rgba(255,255,255,0.10)";
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(24, 24, width - 48, height - 48, 36);
  g.stroke();

  g.textBaseline = "alphabetic";
  g.textAlign = "left";

  const dot = g.createLinearGradient(70, 84, 92, 106);
  dot.addColorStop(0, "#8b7cff");
  dot.addColorStop(1, "#4fd1c5");
  g.fillStyle = dot;
  g.beginPath();
  g.arc(78, 92, 7, 0, TAU);
  g.fill();

  g.fillStyle = "#ececf5";
  g.font = '800 19px "Segoe UI", system-ui, sans-serif';
  drawTracked(g, "AFTERIMAGE", 96, 99, 5);

  const kicker = result.daily
    ? `DAILY #${result.dailyNumber} · ${result.won ? "COMPLETE" : "RUN OVER"}`
    : `${mode.label.toUpperCase()} · ${result.won ? "COMPLETE" : "RUN OVER"}`;
  g.fillStyle = "#4fd1c5";
  g.font = '700 15px "Segoe UI", system-ui, sans-serif';
  drawTracked(g, kicker, 72, 146, 2.5);

  g.fillStyle = "#ffffff";
  g.font = '800 132px "Segoe UI", system-ui, sans-serif';
  g.fillText(result.score.toLocaleString("en-US"), 66, 286);

  g.fillStyle = "#5d5d78";
  g.font = '700 14px "Segoe UI", system-ui, sans-serif';
  drawTracked(g, "POINTS", 72, 318, 3);

  g.font = '700 15px "Segoe UI", system-ui, sans-serif';
  const pillWidth = g.measureText(result.rating).width + 44;
  g.fillStyle = "rgba(139,124,255,0.14)";
  g.strokeStyle = "rgba(139,124,255,0.5)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.roundRect(72, 352, pillWidth, 42, 21);
  g.fill();
  g.stroke();
  g.fillStyle = "#cfc8ff";
  g.fillText(result.rating, 94, 379);

  const stats = [
    ["CLEARED", `${result.cleared}/${result.total}`],
    ["ACCURACY", `${result.accuracy}%`],
    ["BEST STREAK", String(result.bestStreak)]
  ];
  stats.forEach(([label, value], index) => {
    const x = 72 + index * 186;
    g.fillStyle = "#5d5d78";
    g.font = '700 11px "Segoe UI", system-ui, sans-serif';
    drawTracked(g, label, x, 462, 2.2);
    g.fillStyle = "#ececf5";
    g.font = '700 30px "Segoe UI", system-ui, sans-serif';
    g.fillText(value, x, 500);
  });

  if (result.isBest) {
    g.fillStyle = "#ffd479";
    g.font = '700 12px "Segoe UI", system-ui, sans-serif';
    drawTracked(g, result.daily ? "NEW DAILY BEST" : "NEW PERSONAL BEST", 72, 552, 2.6);
  }

  const footer = result.daily
    ? `${result.dailyLabel} · ${result.total} BOARDS · ONE DIFFERENCE`
    : `${result.total} BOARDS · ONE DIFFERENCE · NO HINTS`;
  g.fillStyle = "#6f6f88";
  g.font = '600 12px "Segoe UI", system-ui, sans-serif';
  drawTracked(g, footer, 72, 592, 2);

  drawCardBoard(g, 780, 126);
  return card.toDataURL("image/png");
}

function saveScoreCard() {
  if (!state.result) return;

  let url = "";
  try {
    url = renderScoreCard(state.result);
  } catch {
    ui.saveCard.textContent = "Could not save";
    return;
  }
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  link.download = `afterimage-${state.result.mode}-${state.result.score}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  ui.saveCard.textContent = "Saved";
  ui.saveCard.disabled = true;
  window.setTimeout(() => {
    ui.saveCard.textContent = "Save card";
    ui.saveCard.disabled = false;
  }, 1600);
}

function buildShareText(result) {
  const mode = MODES[result.mode];
  const title = result.daily
    ? `Afterimage Daily #${result.dailyNumber}`
    : `Afterimage · ${mode.label}`;
  return [
    `${title} · ${result.rating}`,
    `${result.score.toLocaleString("en-US")} · ${result.cleared}/${result.total} · ${result.accuracy}%`,
    (result.boards || []).join(""),
    "Find the tile that doesn't belong."
  ].join("\n");
}

async function copyResult() {
  if (!state.result) return;
  const text = buildShareText(state.result);
  let copied = false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
  }

  ui.copyResult.textContent = copied ? "Copied" : "Copy failed";
  ui.copyResult.disabled = true;
  window.setTimeout(() => {
    ui.copyResult.textContent = "Copy result";
    ui.copyResult.disabled = false;
  }, 1600);
}

/* ------------------------------------------------------------------ loop */

function ensureLoop() {
  if (raf) return;
  state.lastFrame = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(now) {
  raf = 0;
  if (state.phase !== "play" && state.phase !== "pause" && state.phase !== "reveal") return;

  const dt = Math.min(0.05, Math.max(0, (now - state.lastFrame) / 1000));
  state.lastFrame = now;

  if (state.phase === "play" && state.timed) {
    state.remaining -= dt * 1000;
    if (state.remaining <= 0) {
      state.remaining = 0;
      updateTimer();
      timeout();
    }
  }

  updateParticles(dt);
  paint();
  updateTimer();

  if (state.phase === "play" || state.phase === "pause" || state.phase === "reveal") {
    raf = requestAnimationFrame(frame);
  }
}

/* ----------------------------------------------------------------- input */

ui.cells.addEventListener("keydown", (event) => {
  const moves = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1]
  };
  const move = moves[event.key];
  if (!move) return;

  const active = document.activeElement;
  if (!active || !active.classList.contains("cell")) return;

  event.preventDefault();
  const n = state.n;
  const index = Number(active.dataset.i);
  const row = (Math.floor(index / n) + move[0] + n) % n;
  const col = ((index % n) + move[1] + n) % n;
  const next = ui.cells.children[row * n + col];
  if (!next) return;

  Array.from(ui.cells.children).forEach((cell) => {
    cell.tabIndex = -1;
  });
  next.tabIndex = 0;
  next.focus();
});

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => startRun(button.dataset.mode));
});

ui.dailyBtn.addEventListener("click", () => startRun("daily"));
ui.playAgain.addEventListener("click", () => startRun(state.mode));
ui.saveCard.addEventListener("click", saveScoreCard);
ui.copyResult.addEventListener("click", copyResult);
ui.changeMode.addEventListener("click", showMenu);
ui.quit.addEventListener("click", showMenu);

ui.skip.addEventListener("click", () => {
  if (state.mode !== "zen" || state.phase !== "play") return;
  state.skipped += 1;
  state.boards.push("⬜");
  advance();
});

ui.sound.addEventListener("click", () => {
  state.muted = !state.muted;
  store.set("afterimage.muted", state.muted ? "1" : "0");
  renderSound();
  if (!state.muted) {
    ensureAudio();
    tone(720, 0.06, "sine", 0.03);
  }
});

document.addEventListener("visibilitychange", () => {
  state.lastFrame = performance.now();
  renderDaily();
});

let resizeTimer = 0;
const observer = new ResizeObserver(() => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (!state.data) return;
    computeLayout();
    paint();
  }, 60);
});
observer.observe(ui.stage);

/* ------------------------------------------------------------------ boot */

renderBests();
renderDaily();
renderSound();
updateTimer();
ui.menu.hidden = false;
ui.over.hidden = true;
ui.veil.hidden = false;
ui.hud.hidden = true;

const requestedMode = new URLSearchParams(window.location.search).get("mode");
if (requestedMode && Object.prototype.hasOwnProperty.call(MODES, requestedMode)) {
  startRun(requestedMode);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* the game runs fine without offline support */
    });
  });
}
