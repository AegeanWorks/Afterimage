'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = () => fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = () => fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = () => fs.readFileSync(path.join(root, 'game.js'), 'utf8');

test('shell ids cover every game ui lookup', () => {
  const ids = new Set([...html().matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const wanted = [...js().matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(wanted.length >= 40, `expected >=40 lookups, got ${wanted.length}`);
  for (const id of wanted) assert.ok(ids.has(id), `shell missing #${id} for getElementById`);
});

test('every BOARD_CLASS value has a .board-strip rule', () => {
  const cssText = css();
  for (const cls of ['ok', 'recovered', 'miss', 'skipped', 'unplayed'])
    assert.ok(cssText.includes(`.board-strip .${cls}`), `styles.css missing .board-strip .${cls}`);
});

test('hud never display:none hiding lives/streak/mode while hud is shown', () => {
  const cssText = css();
  assert.ok(!/@media[^{]*\{[^}]*\.hud-item\.lives\s*\{\s*display\s*:\s*none/.test(cssText), 'lives must not be display:none at any breakpoint');
  assert.ok(!/@media[^{]*\{[^}]*\.hud-item\.streak\s*\{\s*display\s*:\s*none/.test(cssText), 'streak must not be display:none at any breakpoint');
  assert.ok(!/@media[^{]*\{[^}]*\.hud-item\.mode-item\s*\{\s*display\s*:\s*none/.test(cssText), 'mode must not be display:none at any breakpoint');
});

test('veil is a dialog and timer is not aria-hidden without alternative', () => {
  const htmlText = html();
  assert.ok(htmlText.includes('id="veil"') && htmlText.includes('role="dialog"'), 'veil must declare role=dialog');
  assert.ok(htmlText.includes('aria-modal="true"'), 'veil must declare aria-modal=true');
  assert.ok(!htmlText.includes('<div class="timer" id="timer" aria-hidden="true">'), 'timer must expose a text alternative instead of aria-hidden');
});

test('narrow play layout wraps the HUD instead of overflowing', () => {
  const cssText = css();
  const mobile = /@media \(max-width: 640px\) \{([\s\S]*?)\n\}/.exec(cssText);
  assert.ok(mobile, 'styles.css must keep a 640px breakpoint');
  assert.ok(/\.topbar\s*\{[^}]*flex-wrap:\s*wrap/.test(mobile[1]), 'topbar must wrap on narrow screens');
  assert.ok(/\.hud\s*\{[^}]*width:\s*100%/.test(mobile[1]), 'HUD must take its own full-width row');
  assert.ok(/\.hud\s*\{[^}]*margin-left:\s*0/.test(mobile[1]), 'wrapped HUD must not keep the desktop auto margin');
  assert.ok(/\.sound\s*\{[^}]*margin-left:\s*auto/.test(mobile[1]), 'sound control must stay reachable on the brand row');
});

test('keyboard contract stays discoverable and canvas stays hidden from AT', () => {
  const htmlText = html();
  const cssText = css();
  assert.ok(!cssText.includes('.foot-keys { display: none') && !cssText.includes('.foot-keys{display:none'), 'foot-keys hint must never be display:none');
  assert.ok(htmlText.includes('id="board"') && htmlText.includes('aria-hidden="true"'), '#board canvas must be aria-hidden (cells are the interface)');
  assert.ok(htmlText.includes('id="cells"') && /id="cells"[^>]*aria-label=/.test(htmlText), '#cells group must carry an aria-label');
});
