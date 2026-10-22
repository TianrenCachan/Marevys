'use strict';

// Presentation and access tests for the digital deck selector. These execute
// the real browser module with the real public asset registry; no AI, payment
// provider, network request or paid entitlement is involved.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { deckAssetFiles } = require('../scripts/deck-assets.cjs');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'src/deck-gallery.js'), 'utf8');
const CARDS = require('../server/tarot-cards.json');
const MANIFEST = require('../ASSET_MANIFEST.json');
const STYLES = ['cute', 'fairytale', 'realistic', 'christmas'];
const SELECTION_KEY = 'marevys.deck.v1';
const DURING_CHRISTMAS = Date.parse('2026-12-25T12:00:00+01:00');

function page(t, { omit = [], now = DURING_CHRISTMAS } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
    url: 'https://marevys.test/', runScripts: 'outside-only'
  });
  t.after(() => dom.window.close());
  const window = dom.window;
  window.Date.now = () => now;
  window.MAREVYS_TAROT_CARDS = CARDS;
  window.MAREVYS_ASSETS = Object.fromEntries(MANIFEST.assets.map(asset => [asset.key, '/' + asset.file]));
  window.MAREVYS_DECK_ASSETS = Object.fromEntries(Object.entries(deckAssetFiles())
    .filter(([key]) => !omit.includes(key)).map(([key, file]) => [key, '/' + file]));
  const membershipCalls = [];
  window.MarevysDiscovery = { openMembership: () => membershipCalls.push(true) };
  window.eval(SOURCE);
  function element(markup) {
    const container = window.document.createElement('div');
    container.innerHTML = markup;
    assert.equal(container.children.length, 1, 'A rendered card has one root');
    return container.firstElementChild;
  }
  return { window, decks: window.MarevysDecks, element, membershipCalls };
}

function sheetKey(style, index) {
  return 'deck' + style[0].toUpperCase() + style.slice(1) + 'Sheet' + index;
}

test('digital deck registry retains both complete free decks and four distinct complete themes', t => {
  const { decks } = page(t);
  const collection = decks.list();
  assert.deepEqual(Array.from(collection, deck => deck.id), ['original', 'heritage', ...STYLES]);
  assert.equal(new Set(Array.from(collection, deck => deck.name.en)).size, 6);
  for (const id of ['original', 'heritage', ...STYLES]) {
    const deck = decks.get(id);
    assert.equal(deck.cardCount, 78, id + ' reports a complete 78-card collection');
    assert.equal(deck.previewOnly, false, id + ' has usable art, not a cover-only preview');
    assert.equal(deck.available, true, id + ' is available during the configured winter season');
    for (const locale of ['en', 'fr', 'zh']) {
      assert(deck.name[locale]?.trim(), id + ' has a localized name');
      assert(deck.description[locale]?.trim(), id + ' has a localized description');
    }
  }
  assert.equal(decks.get('original').tier, 'free');
  assert.equal(decks.get('heritage').tier, 'free');
  for (const id of STYLES) {
    assert.notEqual(decks.get(id).tier, 'free');
    assert.equal(decks.get(id).sheets.length, 4);
    assert(decks.get(id).sheets.every(Boolean));
    assert.match(decks.get(id).description.en, /22.*56/, 'The illustrated-major / pip-minor distinction is disclosed');
  }
});

test('all 88 themed Major Arcana use distinct art cells and retain the canonical card names', t => {
  const { window, decks, element } = page(t);
  for (const style of STYLES) {
    const addresses = new Set();
    for (let number = 0; number < 22; number++) {
      const card = { id: CARDS[number].id, orientation: 'upright' };
      const face = element(decks.renderFace(card, 'en', style));
      assert.equal(face.getAttribute('role'), 'img');
      assert.equal(face.getAttribute('aria-label'), CARDS[number].name.en);
      const scene = face.querySelector('.marevys-atlas-scene');
      assert(scene, `${style} ${number} has illustrated art`);
      addresses.add(scene.style.backgroundImage + '|' + scene.style.backgroundPosition);
      const expectedSheet = window.MAREVYS_DECK_ASSETS[sheetKey(style, Math.floor(number / 6))];
      assert(scene.style.backgroundImage.includes(expectedSheet), `${style} ${number} uses the correct six-scene sheet`);
      assert(!face.querySelector('.marevys-deck-concept'), 'A complete deck is not silently rendered as a concept cover');
    }
    assert.equal(addresses.size, 22, style + ' has 22 independent major-card addresses');
    const back = element(decks.renderBack(style));
    const minor = element(decks.renderFace(CARDS[22], 'en', style)).querySelector('.minor-ground');
    assert(back.style.backgroundImage.includes(window.MAREVYS_DECK_ASSETS[sheetKey(style, 3)]));
    assert.equal(back.style.backgroundImage, minor.style.backgroundImage);
    assert.notEqual(back.style.backgroundPosition, minor.style.backgroundPosition, 'The card back is not reused as a minor face');
  }
});

test('numbered minors preserve each suit and exact Ace-to-Ten pip count in all four themes', t => {
  const { decks, element } = page(t);
  for (const style of STYLES) {
    const suitDrawings = new Set();
    for (let suit = 0; suit < 4; suit++) {
      const suitStart = 22 + suit * 14;
      for (let rank = 1; rank <= 10; rank++) {
        const card = CARDS[suitStart + rank - 1];
        const face = element(decks.renderFace(style, card, { locale: 'en' }));
        assert.equal(face.getAttribute('aria-label'), card.name.en);
        assert.equal(face.querySelectorAll('.marevys-pip').length, rank, `${style} ${card.name.en} has ${rank} symbols`);
        assert(!face.querySelector('.is-court'), 'A numbered card is not shown as a court card');
        if (rank === 1) suitDrawings.add(face.querySelector('.marevys-pip svg').innerHTML);
      }
    }
    assert.equal(suitDrawings.size, 4, style + ' differentiates all four suit symbols');
  }
});

test('court cards distinguish Page, Knight, Queen and King in English, French and Chinese', t => {
  const { decks, element } = page(t);
  const ranks = {
    en: ['PAGE', 'KNIGHT', 'QUEEN', 'KING'],
    fr: ['VALET', 'CAVALIER', 'REINE', 'ROI'],
    zh: ['侍从', '骑士', '王后', '国王']
  };
  for (const style of STYLES) for (const locale of ['en', 'fr', 'zh']) {
    for (let suit = 0; suit < 4; suit++) for (let rank = 0; rank < 4; rank++) {
      const card = CARDS[22 + suit * 14 + 10 + rank];
      const face = element(decks.renderFace(card, locale, style));
      assert.equal(face.getAttribute('aria-label'), card.name[locale]);
      const field = face.querySelector('.marevys-pip-field.is-court');
      assert(field, card.id + ' is presented as a court card');
      assert.equal(field.querySelector('small').textContent, ranks[locale][rank]);
      assert.equal(field.querySelectorAll('.marevys-pip').length, 1, 'Court cards retain a suit identifier');
    }
  }
});

test('all themed faces support reversed orientation without changing the card or its artwork', t => {
  const { decks, element } = page(t);
  for (const style of STYLES) for (const canonical of CARDS) {
    const input = Object.freeze({ id: canonical.id, orientation: 'reversed' });
    const reversed = element(decks.renderFace(input, 'fr', style));
    const upright = element(decks.renderFace({ id: canonical.id, orientation: 'upright' }, 'fr', style));
    assert(reversed.classList.contains('is-reversed'), style + ' ' + canonical.id + ' is visibly reversed');
    assert(!upright.classList.contains('is-reversed'));
    assert.equal(reversed.getAttribute('aria-label'), canonical.name.fr);
    assert.equal(reversed.querySelector('.marevys-atlas-scene').getAttribute('style'), upright.querySelector('.marevys-atlas-scene').getAttribute('style'));
    assert.equal(input.id, canonical.id);
    assert.equal(input.orientation, 'reversed');
  }
});

test('premium previews never grant membership or replace the selected free deck', t => {
  const { window, decks, element, membershipCalls } = page(t);
  assert.equal(decks.select('heritage'), true);
  for (const style of STYLES) {
    for (const canonical of CARDS) {
      const preview = element(decks.previewFace(style, { id: canonical.id, orientation: 'upright' }, { locale: 'zh' }));
      assert.equal(preview.getAttribute('aria-label'), canonical.name.zh);
    }
    assert.equal(decks.getSelected(), 'heritage', 'Browsing leaves the selection unchanged');
    assert.equal(window.localStorage.getItem(SELECTION_KEY), 'heritage');
    assert.equal(decks.select(style), false, 'An unverified browser cannot select ' + style);
    assert.equal(decks.selectedId(), 'heritage');
    assert.equal(window.localStorage.getItem(SELECTION_KEY), 'heritage');
  }
  assert.equal(membershipCalls.length, 4, 'Locked choices lead to membership information, not a fake activation');
});

test('spoofing a premium deck or membership in localStorage cannot unlock it', t => {
  const { window, decks } = page(t);
  window.localStorage.setItem('marevys.membership', JSON.stringify({ plan: 'atelier', paid: true }));
  window.localStorage.setItem('marevys.plan', 'atelier');
  window.localStorage.setItem('marevys.isMember', 'true');
  for (const style of STYLES) {
    window.localStorage.setItem(SELECTION_KEY, style);
    assert.equal(decks.getSelected(), 'original');
    assert.equal(decks.select(style), false);
    assert.equal(decks.getSelected(), 'original');
  }
  assert.equal(decks.select('original'), true, 'The free collection remains selectable');
});

test('Christmas starts and ends at the exact configured Europe/Paris midnight boundaries', t => {
  const before = Date.parse('2026-11-14T22:59:59.999Z');
  const start = Date.parse('2026-11-14T23:00:00.000Z');
  const last = Date.parse('2027-01-07T22:59:59.999Z');
  const end = Date.parse('2027-01-07T23:00:00.000Z');
  const { decks } = page(t);
  assert.equal(Date.parse(decks.get('christmas').startsAt), start);
  assert.equal(Date.parse(decks.get('christmas').endsAt), end);
  assert.equal(decks.inSeason('christmas', before), false);
  assert.equal(decks.inSeason('christmas', start), true);
  assert.equal(decks.inSeason('christmas', last), true, '7 January remains included');
  assert.equal(decks.inSeason('christmas', end), false, '8 January is outside the campaign');
  const outside = page(t, { now: before });
  assert.equal(outside.decks.get('christmas').cardCount, 78, 'Out of season is not incomplete artwork');
  assert.equal(outside.decks.get('christmas').previewOnly, false);
  assert.equal(outside.decks.get('christmas').available, false);
  assert(outside.decks.previewFace('christmas', CARDS[0], { locale: 'en' }).includes('role="img"'), 'Upcoming seasonal art can be previewed');
});

test('unvalidated concept sheets do not masquerade as complete realistic or Christmas decks', t => {
  for (const style of ['realistic', 'christmas']) {
    const { decks } = page(t, { omit: [sheetKey(style, 2)] });
    assert.equal(decks.get(style).cardCount, 0, 'One missing production sheet makes coverage incomplete');
    assert.equal(decks.get(style).previewOnly, true);
    assert.equal(decks.get(style).available, false);
    assert.equal(decks.select(style), false);
  }
});

test('the 16 production WebP sheets retain square six-cell canvases, distinct artwork and manifest integrity', () => {
  const hashes = new Set();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'decks', 'manifest.json'), 'utf8'));
  const entries = new Map(manifest.images.map(image => [image.web, image]));
  const registry = deckAssetFiles();
  for (const style of STYLES) for (let sheet = 0; sheet < 4; sheet++) {
    const name = `${style}-sheet-${sheet}.webp`;
    const file = path.join(ROOT, 'assets', 'decks', name);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', 'Production art has a RIFF container');
    assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'The RIFF header covers the complete file');
    assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP');
    assert.equal(bytes.subarray(12, 16).toString('ascii'), 'VP8 ', 'Quality-88 production sheets use VP8 image data');
    assert.equal(bytes.subarray(23, 26).toString('hex'), '9d012a', 'VP8 frame contains the key-frame size header');
    const width = bytes.readUInt16LE(26) & 0x3fff, height = bytes.readUInt16LE(28) & 0x3fff;
    assert(width >= 1200 && height >= 1200, 'The six-card sheet retains suitable digital resolution');
    assert.equal(width, height, 'Three columns by two rows yield portrait 2:3 cells');
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const entry = entries.get(name);
    assert(entry, name + ' has a provenance record');
    assert.equal(entry.webBytes, bytes.length, name + ' byte count matches the manifest');
    assert.equal(entry.webSha256, sha256, name + ' content hash matches the manifest');
    assert.equal(entry.dimensions, `${width}x${height}`, name + ' canvas matches the manifest');
    assert.equal(registry[sheetKey(style, sheet)], `assets/decks/${name}`, 'Production registry directly addresses WebP');
    hashes.add(sha256);
  }
  assert.equal(hashes.size, 16, 'A single production image is not reused under different sheet filenames');
});
