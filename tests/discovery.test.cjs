'use strict';

// Exercise the emitted public application against an isolated real Tarot API.
// These DOM checks cover behavior and state boundaries, not browser painting.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { JSDOM, VirtualConsole } = require('jsdom');
const { buildWeb } = require('../scripts/build-web.cjs');
const { createHandler: createTarot } = require('../api/tarot.js');

let temporary, dist, html, scripts, server, origin;
const windows = new Set();
const forbiddenProvider = async () => { throw new Error('Discovery tests never contact external providers'); };
const tarot = createTarot({ env: { NODE_ENV: 'test', SESSION_SECRET: 'discovery-dom-tests-only-not-a-real-credential' }, fetchImpl: forbiddenProvider });

test.before(async () => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'marevys-discovery-dom-'));
  dist = path.join(temporary, 'dist');
  buildWeb({ outputDir: dist });
  html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)].map(match => fs.readFileSync(path.join(dist, match[1].replace(/^\//, '')), 'utf8'));
  assert.equal(scripts.length, 2, 'Use the public runtime and complete emitted bundle');
  server = http.createServer(async (request, response) => {
    if (new URL(request.url, 'http://localhost').pathname !== '/api/tarot') {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: { code: 'NO_TEST_ROUTE' } }));
      return;
    }
    try { await tarot(request, response); }
    catch { response.statusCode = 500; response.end(JSON.stringify({ error: { code: 'TEST_HANDLER_FAILED' } })); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://localhost:${server.address().port}`;
});

test.after(async () => {
  for (const dom of windows) { dom.window.MarevysStudio?.pause(); dom.window.close(); }
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
});

function page(seed = {}) {
  const errors = [], calls = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, {
    url: origin + '/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = () => {};
      window.HTMLElement.prototype.scrollTo = () => {};
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      window.confirm = () => true;
      window.AbortController = globalThis.AbortController;
      window.AbortSignal = globalThis.AbortSignal;
      window.fetch = async (url, options = {}) => {
        const absolute = new URL(url, origin);
        assert.equal(absolute.origin, origin, 'The emitted application must not call external services in these tests');
        const call = { path: absolute.pathname, payload: options.body ? JSON.parse(options.body) : null };
        calls.push(call);
        const response = await fetch(absolute, { ...options, headers: { ...options.headers, Origin: origin } });
        call.status = response.status;
        call.response = await response.clone().json();
        return response;
      };
      window.localStorage.setItem('marevys.language.v1', JSON.stringify('en'));
      for (const [key, value] of Object.entries(seed)) window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  });
  windows.add(dom);
  for (const source of scripts) dom.window.eval(source);
  const q = selector => dom.window.document.querySelector(selector);
  const qa = selector => [...dom.window.document.querySelectorAll(selector)];
  const click = selector => { const node = q(selector); assert(node, `Control ${selector} exists`); assert(!node.disabled, `Control ${selector} is enabled`); node.click(); return node; };
  const fill = (selector, value) => { const node = q(selector); assert(node, `Field ${selector} exists`); node.value = value; node.dispatchEvent(new dom.window.Event('input', { bubbles: true })); node.dispatchEvent(new dom.window.Event('change', { bubbles: true })); return node; };
  const submit = selector => { const form = q(selector); assert(form, `Form ${selector} exists`); assert(form.checkValidity(), `Form ${selector} has valid values`); form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); };
  const close = () => { assert.deepEqual(errors.map(error => error.message), [], 'No emitted-runtime errors'); dom.window.MarevysStudio?.pause(); dom.window.close(); windows.delete(dom); };
  return { w: dom.window, q, qa, click, fill, submit, calls, close };
}
async function until(predicate, message, timeout = 6000) {
  const started = Date.now();
  while (Date.now() - started < timeout) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 15)); }
  assert.fail('Timed out: ' + message);
}
async function shuffleFromQuestion(p) {
  p.submit('#studioQuestionForm');
  p.click('[name="consent"]');
  p.submit('#studioDetailsForm');
  await until(() => p.q('.view-draw') && !p.q('.studio-loading'), 'real session reaches the draw view');
  const started = p.calls.find(call => call.path === '/api/tarot' && call.payload?.action === 'start');
  assert.equal(started.status, 200);
  return started;
}
function current(p) { return JSON.parse(p.w.sessionStorage.getItem('marevys.currentReading.v2')); }
function imageUrl(markup) { const match = markup.match(/\bsrc="([^"]+)"/); assert(match, 'Card rendering contains its real asset'); return match[1]; }
function bytesFor(url) { return fs.readFileSync(path.join(dist, url.replace(/^\//, ''))); }

test('Discovery: an unchanged job-offer chip reaches the real career-offer session with three themed positions', async () => {
  const p = page();
  p.click('#discoveryHome [data-category="work"]');
  p.click('#discoveryHome [data-prompt="0"]');
  assert.match(p.q('#discoveryQuestion').value, /job offer/i);
  const question = p.q('#discoveryQuestion').value;
  p.submit('#discoveryQuestionForm');
  assert.equal(p.q('#studioQuestion').value, question, 'The chosen question survives the homepage-to-studio handoff');
  const started = await shuffleFromQuestion(p);
  assert.equal(started.payload.question, question);
  assert.equal(started.payload.modeId, 'career-offer');
  assert.equal(started.payload.spreadId, 'three');
  assert.equal(started.response.context.positions.length, 3);
  assert.deepEqual(started.response.context.positions.map(position => position.id), ['offer_value', 'offer_check', 'offer_next_step']);
  p.close();
});

test('Discovery: free writing and edited chips keep visitor wording without forcing a thematic interpretation', () => {
  for (const category of ['love', 'work', 'decisions', 'myself']) {
    const p = page();
    p.click(`#discoveryHome [data-category="${category}"]`);
    if (category === 'work') p.click('#discoveryHome [data-prompt="0"]');
    const question = `My own ${category} question, with a detail that does not occur in a suggested prompt.`;
    p.fill('#discoveryQuestion', question);
    p.submit('#discoveryQuestionForm');
    assert.equal(p.q('#studioQuestion').value, question);
    assert.equal(current(p).draft.modeId, 'open', 'Free writing and edits use an open reading, independent of the browsing category');
    assert.equal(current(p).draft.spreadId, 'three');
    assert.equal(p.calls.length, 0, 'Writing and selecting a topic do not trigger a reading or charge');
    p.close();
  }
});

test('Discovery: free love mode starts a reading; a member mode opens an explanation without a reading or charge', () => {
  const p = page();
  p.w.MarevysDiscovery.openLove();
  p.click('#discoveryDrawer [data-mode-id="love-feelings"]');
  assert(p.q('.view-question'));
  assert.equal(current(p).draft.modeId, 'love-feelings');
  assert.equal(current(p).draft.spreadId, 'three');
  p.w.MarevysStudio.close();
  p.w.MarevysDiscovery.openLove();
  p.click('#discoveryDrawer [data-mode-id="love-relationship"]');
  assert(p.q('.discovery-unlock-actions'), 'Locked mode has an actionable membership explanation');
  p.click('#discoveryDrawer [data-discovery-action="membership"]');
  assert.equal(p.qa('.discovery-plan').length, 3);
  assert.equal(p.calls.length, 0, 'The paywall preview makes no network or payment request');
  assert.equal(p.w.localStorage.getItem('marevys.membership.v1'), null, 'Viewing memberships never manufactures a paid account');
  p.close();
});

test('Discovery: membership comparison visibly remains pending and offers a working free route', () => {
  const p = page();
  p.w.MarevysDiscovery.openMembership();
  assert.match(p.q('.discovery-membership-notice').textContent, /not on sale yet/i);
  assert.match(p.q('.discovery-membership-notice').textContent, /no payment is taken/i);
  assert.equal(p.qa('.discovery-coming-label').length, 2);
  assert(p.qa('.discovery-plan-price').slice(1).every(node => /coming soon/i.test(node.textContent)), 'Paid cards do not advertise an invented active price');
  assert.equal(p.qa('#discoveryDrawer input, #discoveryDrawer form, #discoveryDrawer a[href*="checkout"]').length, 0, 'Pending memberships do not collect checkout data');
  p.click('#discoveryDrawer [data-discovery-action="free-reading"]');
  assert(p.q('.view-question'), 'The comparison links to a usable free experience');
  assert.equal(p.calls.length, 0);
  p.close();
});

test('Discovery: changing language preserves the visitor question, category and selected free deck', async () => {
  const p = page();
  p.click('#discoveryHome [data-category="work"]');
  const question = 'My exact wording about two roles should survive translation.';
  p.fill('#discoveryQuestion', question);
  p.w.MarevysDiscovery.openDecks();
  p.click('[data-discovery-action="deck-index"][data-deck-index="1"]');
  p.click('[data-discovery-action="select-deck"][data-deck-id="heritage"]');
  await until(() => p.w.MarevysDecks.getSelected() === 'heritage' && p.q('.discovery-selected-label'), 'heritage selected in the gallery');
  p.w.MarevysDiscovery.close();
  p.fill('select[data-language]', 'zh');
  await until(() => p.q('#discoveryHome [data-category="work"]').textContent === '事业', 'Chinese discovery navigation');
  assert.equal(p.q('#discoveryQuestion').value, question);
  assert.equal(p.q('#discoveryHome [data-category="work"]').getAttribute('aria-pressed'), 'true');
  assert.equal(p.w.MarevysDecks.getSelected(), 'heritage');
  assert.match(p.q('.discovery-current-deck strong').textContent, /经典/);
  p.close();
});

test('Discovery: original and heritage have distinct emitted artwork, and a running reading keeps its chosen deck', async () => {
  const p = page();
  const card = { id: 'TAROT_17', orientation: 'upright' };
  const original = imageUrl(p.w.MarevysDecks.renderFace('original', card, { locale: 'en' }));
  const heritage = imageUrl(p.w.MarevysDecks.renderFace('heritage', card, { locale: 'en' }));
  assert.notEqual(original, heritage);
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  assert.notEqual(digest(bytesFor(original)), digest(bytesFor(heritage)), 'The two free decks contain different art, not just renamed options');
  p.w.MarevysDiscovery.openDecks();
  p.click('[data-discovery-action="deck-index"][data-deck-index="1"]');
  p.click('[data-discovery-action="select-deck"][data-deck-id="heritage"]');
  await until(() => p.w.MarevysDecks.getSelected() === 'heritage', 'select free heritage deck');
  p.w.MarevysDiscovery.close();
  p.w.MarevysStudio.startPreset({ modeId: 'decision', question: 'What should I consider before choosing my next step?', spreadId: 'three' });
  const started = await shuffleFromQuestion(p);
  assert.equal(current(p).session.deckId, 'heritage');
  assert(p.q('.deck-card .heritage-back'), 'The running deck uses the selected heritage back');
  p.w.MarevysDiscovery.openDecks();
  p.click('[data-discovery-action="deck-index"][data-deck-index="0"]');
  p.click('[data-discovery-action="select-deck"][data-deck-id="original"]');
  await until(() => p.w.MarevysDecks.getSelected() === 'original', 'change the preference for a future reading');
  p.w.MarevysDiscovery.close();
  assert.equal(current(p).session.deckId, 'heritage', 'Global preference does not alter an active session');
  assert.equal(current(p).session.readingId, started.response.readingId, 'Switching future deck preference does not restart or reshuffle');
  assert(p.q('.deck-card .heritage-back'));
  p.click('[data-action="autoPick"]');
  p.click('[data-action="reveal"]');
  await until(() => p.q('.view-reveal'), 'reveal the fixed session');
  p.click('[data-action="flip"]');
  const image = p.q('.revealed-card.face-up .card-turn img');
  const revealed = p.calls.find(call => call.payload?.action === 'reveal').response.cards[0];
  const expected = p.w.MAREVYS_DECK_ASSETS['tarotClassic' + revealed.id.slice(-2)];
  assert.equal(image.getAttribute('src'), expected, 'Revealed faces keep the deck frozen at shuffle time');
  assert.equal(current(p).session.deckId, 'heritage');
  p.close();
});

test('Discovery: completed seasonal art can be previewed without granting membership', () => {
  const p = page();
  const deck = p.w.MarevysDecks.get('christmas');
  assert.equal(deck.seasonal, true);
  assert.equal(deck.previewOnly, false);
  assert.equal(deck.artworkStatus, 'digital-illustrated-majors-and-pip-minors');
  assert.equal(deck.cardCount, 78);
  assert.equal(deck.targetCardCount, 78);
  assert(Number.isFinite(Date.parse(deck.startsAt)) && Date.parse(deck.endsAt) > Date.parse(deck.startsAt));
  p.w.MarevysDiscovery.openDecks();
  p.click('[data-discovery-action="deck-index"][data-deck-index="5"]');
  assert.equal(p.q('.discovery-concept-sheet'), null, 'Complete artwork is shown as individual cards');
  assert(p.q('.discovery-deck-face .deck-christmas'), 'The gallery renders the actual Christmas artwork');
  assert.equal(p.qa('.discovery-art-sample').length,6,'Members-only artwork remains previewable');
  assert.match(p.q('.discovery-season-dates').textContent, /15 November.*7 January/, 'Visible seasonal dates agree with the configured winter collection');
  assert.equal(p.w.MarevysDecks.select('christmas'), false);
  assert.equal(p.w.MarevysDecks.getSelected(), 'original', 'Previewing or trying a future collection cannot grant a paid deck');
  assert.equal(p.calls.length, 0);
  p.close();
});
