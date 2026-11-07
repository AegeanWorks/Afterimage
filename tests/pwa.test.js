'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('sw cache version is pinned', () => {
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(sw, /const CACHE = "afterimage-v24";/);
});

test('pwa shell entries all resolve to tracked files', () => {
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const shell = JSON.parse(sw.match(/const SHELL = (\[[\s\S]*?\]);/)[1]);
  assert.ok(!shell.includes(''), 'shell must not duplicate ROOT and INDEX');
  for (const p of shell.filter(Boolean))
    assert.ok(fs.existsSync(path.join(__dirname, '..', p)), `shell missing ${p}`);
  assert.strictEqual(new Set(shell).size, shell.length);
});

test('sw install is atomic-safe and activate is scoped', () => {
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.ok(sw.includes('allSettled'), 'install must tolerate single-asset failure');
  assert.ok(sw.includes('afterimage-'), 'activate must scope to afterimage caches');
});

test('sw asset fallback is typed, not empty 504', () => {
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.ok(!sw.includes('new Response("", { status: 504 })'), 'empty 504 fallback must go');
  assert.ok(sw.includes('503'), 'offline fallback must be typed 503');
});

test('manifest icons and shortcuts match install contract', () => {
  const m = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  assert.strictEqual(m.start_url, './');
  assert.strictEqual(m.scope, './');
  for (const i of m.icons)
    assert.ok(fs.existsSync(path.join(__dirname, '..', i.src)), `icon missing ${i.src}`);
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  const urls = m.shortcuts.map((s) => s.url).sort();
  assert.deepStrictEqual(urls, ['./?mode=daily', './?mode=nightmare', './?mode=onslaught']);
});

test('PLAY.bat serves 8139 on loopback from its own dir', () => {
  const bat = fs.readFileSync(path.join(__dirname, '..', 'PLAY.bat'), 'utf8');
  assert.match(bat, /cd \/d "%~dp0"/);
  assert.match(bat, /python -m http\.server 8139 --bind 127\.0\.0\.1/);
  assert.match(bat, /http:\/\/127\.0\.0\.1:8139\//);
});

test('make_icons is import-pure with exact tile geometry', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'tools', 'make_icons.py'), 'utf8');
  assert.ok(!/^OUT\.mkdir/m.test(src), 'OUT.mkdir must not run at import time');
  assert.ok(src.includes('OUT.mkdir(exist_ok=True)'), 'main must create OUT');
  assert.ok(src.includes('x + tile - 1'), 'tile boxes must account for inclusive Pillow coordinates');
  assert.ok(src.includes('Pillow>=9.1'), 'missing Pillow must print a Fix hint');
});
