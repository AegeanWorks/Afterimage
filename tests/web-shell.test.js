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

test('blocked copy results expose a manual fallback panel', () => {
  const htmlText = html();
  const cssText = css();
  const jsText = js();
  assert.ok(htmlText.includes('id="copyFallback"'), 'index.html must carry the copy fallback panel');
  assert.ok(htmlText.includes('id="copyText"'), 'index.html must carry the selectable share text');
  assert.ok(htmlText.includes('id="copyClose"'), 'index.html must let the player close the fallback');
  assert.ok(cssText.includes('.copy-fallback'), 'styles.css must style the fallback panel');
  assert.ok(jsText.includes('copyFeedback'), 'game.js must derive the copy feedback state');
  assert.ok(jsText.includes('showCopyFallback'), 'game.js must open the manual fallback');
});

test('failed score-card saves surface a live status fallback', () => {
  const htmlText = html();
  const jsText = js();
  assert.ok(htmlText.includes('id="saveStatus"'), 'index.html must carry the save status node');
  assert.ok(/id="saveStatus"[^>]*role="status"/.test(htmlText), 'save status must be a live status region');
  assert.ok(/id="saveStatus"[^>]*aria-live="polite"/.test(htmlText), 'save status must use polite live updates');
  assert.ok(jsText.includes('saveCardFeedback'), 'game.js must derive the save feedback');
  assert.ok(jsText.includes('Card unavailable'), 'game.js must explain a failed card export');
});

test('the final board carries a persistent boss marker', () => {
  const htmlText = html();
  const cssText = css();
  const jsText = js();
  assert.ok(htmlText.includes('id="finalBadge"'), 'index.html must carry the final-board badge');
  assert.ok(htmlText.includes('class="final-badge"'), 'final badge must use its CSS hook');
  assert.ok(cssText.includes('.final-badge'), 'styles.css must style the final badge');
  assert.ok(cssText.includes('.stage.finale'), 'styles.css must style the final stage');
  assert.ok(jsText.includes('final: document.getElementById("finalBadge")'), 'game.js must look up the badge');
  assert.ok(jsText.includes('isFinalBoard(state.level, state.levels.length)'), 'nextLevel must derive the final state');
  assert.ok(jsText.includes('classList.toggle("finale", final)'), 'the stage must toggle the finale class');
  const hides = jsText.match(/ui\.final\.hidden = true/g) || [];
  assert.ok(hides.length >= 2, 'start/menu/finish paths must clear the final badge');
});

test('surge boards keep a persistent stage badge', () => {
  const htmlText = html();
  const cssText = css();
  const jsText = js();
  assert.ok(htmlText.includes('id="surgeBadge"'), 'index.html must carry the surge badge node');
  assert.ok(htmlText.includes('class="surge-badge"'), 'surge badge must use its CSS hook');
  assert.ok(cssText.includes('.surge-badge'), 'styles.css must style the surge badge');
  assert.ok(jsText.includes('surge: document.getElementById("surgeBadge")'), 'game.js must look up the badge');
  assert.ok(jsText.includes('ui.surge.hidden = !surge'), 'nextLevel must show/hide the badge by board');
  const hides = jsText.match(/ui\.surge\.hidden = true/g) || [];
  assert.ok(hides.length >= 2, 'start/menu/finish paths must clear the badge');
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
