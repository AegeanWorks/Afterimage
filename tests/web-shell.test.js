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

test('the modal dialog contains Tab focus', () => {
  const jsText = js();
  assert.ok(jsText.includes('function trapDialogFocus('), 'game.js must define the dialog Tab trap');
  assert.ok(jsText.includes('event.key !== "Tab"'), 'the trap must only handle Tab');
  assert.ok(jsText.includes('ui.over.hidden ? ui.menu : ui.over'), 'the trap must pick the visible dialog card');
  assert.ok(jsText.includes('trapDialogFocus'), 'the trap must be registered');
});

test('first load focuses the menu daily card', () => {
  const jsText = js();
  const bootStart = jsText.lastIndexOf('renderBests();');
  const bootEnd = jsText.indexOf('const requestedMode');
  assert.ok(bootStart >= 0 && bootEnd > bootStart, 'game.js must keep the boot block');
  assert.ok(jsText.slice(bootStart, bootEnd).includes('ui.dailyBtn.focus'), 'boot must focus the primary Daily action');
});

test('the lives HUD exposes a visible count and value', () => {
  const htmlText = html();
  const cssText = css();
  const jsText = js();
  assert.ok(htmlText.includes('id="lifeCount"'), 'index.html must carry the visible lives count');
  assert.ok(cssText.includes('.life-count'), 'styles.css must style the lives count');
  assert.ok(jsText.includes('livesLabel'), 'game.js must format the lives value');
  assert.ok(jsText.includes('aria-label'), 'the lives dots must expose their value');
});

test('the timer exposes a second-by-second readout and value', () => {
  const cssText = css();
  const jsText = js();
  assert.ok(cssText.includes('attr(data-time)'), 'styles.css must render the timer readout');
  assert.ok(jsText.includes('timerLabel'), 'game.js must format the remaining seconds');
  assert.ok(jsText.includes('setAttribute("aria-label"'), 'the timer must expose its current value to assistive tech');
});

test('a nonfatal wrong pick restores grid focus', () => {
  const jsText = js();
  const pickBody = jsText.slice(jsText.indexOf('function pick('), jsText.indexOf('function timeout('));
  assert.ok(pickBody.includes('ui.cells.children[index]'), 'the wrong branch must target the picked cell');
  assert.ok(pickBody.includes('.focus({ preventScroll: true })'), 'the wrong branch must restore focus after the pause');
});

test('the result card takes focus when it opens', () => {
  const htmlText = html();
  const jsText = js();
  const overTag = /<section class="card" id="over"[^>]*>/.exec(htmlText);
  assert.ok(overTag, 'index.html must keep the result card');
  assert.ok(/tabindex="-1"/.test(overTag[0]), 'the result card must be programmatically focusable');
  const finishBody = jsText.slice(jsText.indexOf('function finish('), jsText.indexOf('function showMenu('));
  assert.ok(finishBody.includes('ui.over.focus'), 'finish must focus the result card');
  assert.ok(finishBody.includes('setAttribute("aria-labelledby", "resultTitle")'), 'the dialog label must switch to the result title');
  const menuBody = jsText.slice(jsText.indexOf('function showMenu('), jsText.indexOf('function shake('));
  assert.ok(menuBody.includes('setAttribute("aria-labelledby", "title")'), 'the dialog label must switch back to the menu title');
});

test('returning to the menu restores focus to the daily card', () => {
  const match = /function showMenu\(\) \{([\s\S]*?)\n\}/.exec(js());
  assert.ok(match, 'game.js must keep showMenu');
  assert.ok(match[1].includes('ui.dailyBtn.focus'), 'showMenu must focus the primary Daily action');
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

test('the game shell leaves the accessibility tree while a dialog is open', () => {
  const jsText = js();
  assert.ok(jsText.includes('setShellInert'), 'game.js must toggle shell inertness');
  assert.ok(jsText.includes('shell.setAttribute("inert"'), 'the shell must be inert while a dialog is open');
  assert.ok(jsText.includes('shell.setAttribute("aria-hidden"'), 'the shell must be hidden from the accessibility tree');
  assert.ok(jsText.includes('setShellInert(true)'), 'menu/result paths must inert the shell');
  assert.ok(jsText.includes('setShellInert(false)'), 'starting a run must restore the shell');
});

test('narrow HUD keeps the focus lives label visible', () => {
  const cssText = css();
  const mobile = /@media \(max-width: 640px\) \{([\s\S]*?)\n\}/.exec(cssText);
  assert.ok(mobile, 'styles.css must keep a 640px breakpoint');
  assert.ok(
    !/\.hud-item\.lives \.k\s*\{[^}]*display:\s*none/.test(cssText),
    'the Focus lives label must not be hidden on narrow screens'
  );
});

test('narrow HUD keeps the streak label visible', () => {
  const cssText = css();
  const mobile = /@media \(max-width: 640px\) \{([\s\S]*?)\n\}/.exec(cssText);
  assert.ok(mobile, 'styles.css must keep a 640px breakpoint');
  assert.ok(
    !/\.hud-item\.streak \.k\s*\{[^}]*display:\s*none/.test(mobile[1]),
    'the streak label must not be hidden on narrow screens'
  );
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

test('a grid rebuild restores the focused cell', () => {
  const jsText = js();
  assert.ok(jsText.includes('function focusedCellIndex('), 'game.js must resolve the focused cell index');
  const layoutBody = /function computeLayout\(\) \{([\s\S]*?)\n\}/.exec(jsText);
  assert.ok(layoutBody, 'game.js must keep computeLayout');
  assert.ok(layoutBody[1].includes('focusedCellIndex('), 'the rebuild must read the focused cell before clearing the grid');
  assert.ok(layoutBody[1].includes('.focus('), 'the rebuilt grid must restore focus to that cell');
});

test('quitting a decided run lands on its result instead of the menu', () => {
  const jsText = js();
  assert.ok(jsText.includes('function decidedOutcome('), 'game.js must identify a decided run');
  const quitBody = /function quitRun\(\) \{([\s\S]*?)\n\}/.exec(jsText);
  assert.ok(quitBody, 'game.js must keep quitRun');
  assert.ok(quitBody[1].includes('decidedOutcome(state.phase, state.pendingOutcome)'), 'quit must check the pending outcome');
  assert.ok(quitBody[1].includes('finish('), 'a decided quit must hand off to finish so the result is recorded');
  assert.ok(quitBody[1].includes('state.boards.push("🟥")'), 'a fatal-miss quit must keep its red board');
  const pickBody = jsText.slice(jsText.indexOf('function pick('), jsText.indexOf('function timeout('));
  assert.ok(pickBody.includes('state.pendingOutcome'), 'pick must mark a last-board win or a fatal miss');
  const timeoutBody = jsText.slice(jsText.indexOf('function timeout('), jsText.indexOf('function advance('));
  assert.ok(timeoutBody.includes('state.pendingOutcome'), 'timeout must mark a lost run');
});

test('a hide that spans pause or reveal charges the next timed board', () => {
  const jsText = js();
  assert.ok(jsText.includes('function tracksHiddenTime('), 'game.js must decide which active phases count as hidden time');
  assert.ok(jsText.includes('function hiddenReturn('), 'game.js must split immediate and pending hidden charges');
  const hideHandler = jsText.slice(
    jsText.indexOf('document.addEventListener("visibilitychange"'),
    jsText.indexOf('let resizeTimer')
  );
  assert.ok(hideHandler.includes('tracksHiddenTime(state.timed, state.phase)'), 'the hide path must track play, pause and reveal');
  assert.ok(hideHandler.includes('hiddenReturn(state.remaining, hiddenMs, state.timed, state.phase)'), 'the show path must charge the hidden interval');
  assert.ok(hideHandler.includes('state.pendingHidden'), 'a pause/reveal hide must be carried to the next board');
  const nextLevelBody = jsText.slice(jsText.indexOf('function nextLevel('), jsText.indexOf('function pick('));
  assert.ok(nextLevelBody.includes('state.pendingHidden'), 'nextLevel must apply the pending hidden charge');
});
