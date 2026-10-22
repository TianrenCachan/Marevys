'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MODES, getMode, publicModes } = require('../server/experience-catalog.cjs');
const { SPREADS, startSession, revealSession, clarifySession, encryptSession, decryptSession, publicSession, drawnCards } = require('../server/tarot-engine.cjs');
const { normalizeDeepRequest, deepResponseSchema } = require('../server/deep-reading.cjs');
const { createHandler } = require('../api/tarot.js');
const now = Date.parse('2026-10-22T14:00:00Z');
const env = { SESSION_SECRET: 'test-mode-session-secret-at-least-32-characters' };
const start = (extra = {}) => ({ action: 'start', locale: 'zh', question: '我是否应该接受这份工作？', background: '希望先确认工作安排。', timeframe: '未来一个月', spreadId: 'three', usesReversals: true, ...extra });
function request(body) { return { method: 'POST', headers: { host: 'marevys.test', origin: 'https://marevys.test', 'content-type': 'application/json' }, body }; }
async function invoke(handler, body) {
  const res = { setHeader() {}, end(raw) { this.body = JSON.parse(raw); } };
  await handler(request(body), res);
  return res;
}

test('Every themed mode has a complete localized fixed spread and keeps crypto-shuffled card identities', () => {
  const expected = {
    'love-feelings': 'three', 'love-relationship': 'five', 'love-reconnection': 'five', 'love-new': 'three',
    'career-offer': 'three', 'career-change': 'five', decision: 'three', daily: 'one', monthly: 'five', seasonal: 'five'
  };
  assert.deepEqual(Object.fromEntries(Object.values(MODES).filter(m => m.id !== 'open').map(m => [m.id, m.spreadId])), expected);
  for (const [modeId, spreadId] of Object.entries(expected)) {
    const initial = startSession(start({ modeId, spreadId }), now);
    assert.equal(new Set(initial.deck.map(card => card.id)).size, 78);
    const publicValue = publicSession(initial, encryptSession(initial, env));
    assert.equal(publicValue.context.modeId, modeId);
    assert.equal(publicValue.context.positions.length, SPREADS[spreadId].length);
    assert.equal(new Set(publicValue.context.positions.map(p => p.id)).size, SPREADS[spreadId].length);
    for (const position of publicValue.context.positions) {
      for (const locale of ['en', 'fr', 'zh']) assert(position.name[locale].trim());
    }
    const revealed = revealSession(initial, Array.from({ length: SPREADS[spreadId].length }, (_, i) => i));
    assert.deepEqual(drawnCards(revealed).map(card => card.positionId), MODES[modeId].positions.map(p => p.id));
    assert.deepEqual(drawnCards(revealed).map(card => card.id), initial.deck.slice(0, SPREADS[spreadId].length).map(card => card.id));
  }
});

test('Omitted/open mode preserves all existing generic spreads and backward-compatible session contexts', () => {
  for (const spreadId of ['one', 'three', 'five']) {
    const legacy = startSession(start({ spreadId }), now);
    assert.equal(legacy.context.modeId, undefined);
    const resumed = decryptSession(encryptSession(legacy, env), env, now);
    assert.deepEqual(publicSession(resumed, '').context.positions, SPREADS[spreadId]);
    const open = startSession(start({ spreadId, modeId: 'open' }), now);
    assert.deepEqual(publicSession(open, '').context.positions, SPREADS[spreadId]);
  }
});

test('Unsupported modes, inherited keys, arbitrary objects and incompatible spread sizes are rejected', () => {
  for (const modeId of [null, '', 'unknown', '__proto__', 'constructor', {}, ['daily'], 1]) {
    assert.equal(getMode(modeId), null);
    assert.throws(() => startSession(start({ modeId }), now), /INVALID_MODE/);
  }
  assert.throws(() => startSession(start({ modeId: 'daily', spreadId: 'five' }), now), /INVALID_MODE_SPREAD/);
  assert.throws(() => startSession(start({ modeId: 'love-relationship', spreadId: 'three' }), now), /INVALID_MODE_SPREAD/);
  const invalid = startSession(start(), now);
  invalid.context.modeId = 'unknown';
  assert.throws(() => decryptSession(encryptSession(invalid, env), env, now), /INVALID_SESSION/);
});

test('Mode focus and card positions are trusted server references, unaffected by client spoofing or follow-up', () => {
  const original = revealSession(startSession(start({ modeId: 'career-offer' }), now), [2, 7, 21]);
  const token = encryptSession(original, env);
  const spoofed = { schemaVersion: 2, system: 'TAROT', token, modeId: 'daily',
    positions: [{ id: 'fake' }], readingMode: { focus: 'FAKE CLIENT INSTRUCTION' }, plan: 'atelier' };
  const first = normalizeDeepRequest(spoofed, env, now);
  assert.equal(first.reference.readingMode.id, 'career-offer');
  assert.equal(first.reference.readingMode.focus, MODES['career-offer'].focus);
  assert.deepEqual(first.reference.positions, MODES['career-offer'].positions);
  assert(!JSON.stringify(first.reference).includes('FAKE CLIENT INSTRUCTION'));
  const followup = normalizeDeepRequest({ ...spoofed, locale: 'fr', followupQuestion: 'Comment demander ces précisions ?' }, env, now);
  assert.equal(followup.reference.readingMode.id, 'career-offer');
  assert.equal(followup.readingId, first.readingId);
  assert.deepEqual(followup.reference.cards.map(c => [c.id, c.orientation, c.positionId]), first.reference.cards.map(c => [c.id, c.orientation, c.positionId]));
  const schema = deepResponseSchema(first);
  assert.equal(schema.properties.cardReadings.minItems, 3);
  assert.equal(schema.properties.cardReadings.items.anyOf[0].properties.positionId.enum[0], 'offer_value');
  const clarified = clarifySession(original, '哪些条件应该先向招聘方确认？');
  assert.deepEqual(drawnCards(clarified).slice(0, 3), drawnCards(original));
  assert.equal(drawnCards(clarified).at(-1).positionId, 'clarifier');
});

test('API ledger preserves the original mode even when an old token is replayed with mode overrides', async () => {
  const handler = createHandler({ env, now: () => now });
  const initial = await invoke(handler, start({ modeId: 'love-feelings' }));
  assert.equal(initial.statusCode, 200);
  const revealed = await invoke(handler, { action: 'reveal', token: initial.body.token, indices: [1, 3, 5], modeId: 'career-offer' });
  assert.equal(revealed.statusCode, 200);
  assert.equal(revealed.body.context.modeId, 'love-feelings');
  assert.deepEqual(revealed.body.cards.map(c => c.positionId), MODES['love-feelings'].positions.map(p => p.id));
  const replay = await invoke(handler, { action: 'reveal', token: initial.body.token, indices: [1, 3, 5], modeId: 'daily', spreadId: 'one' });
  assert.equal(replay.statusCode, 200);
  assert.deepEqual(replay.body.cards, revealed.body.cards);
  const changed = await invoke(handler, { action: 'reveal', token: initial.body.token, indices: [1, 3, 6] });
  assert.equal(changed.statusCode, 409);
});

test('Public mode catalogue exposes human-facing data without internal instructions or payment claims', () => {
  const publicValue = publicModes();
  assert.equal(publicValue.length, 11);
  assert(publicValue.every(m => !Object.hasOwn(m, 'focus') && !Object.hasOwn(m, 'plan')));
  assert(Object.isFrozen(MODES));
  assert(Object.isFrozen(MODES['career-offer'].positions[0].name));
});

test('Natal and relationship astrology follow-ups carry bounded untrusted dialogue while recomputing the same chart', () => {
  const birth = { date: '1995-04-15', time: '12:30', timeUnknown: false, latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' };
  const partnerBirth = { date: '1992-07-10', time: '09:15', timeUnknown: false, latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' };
  const conversation = [{ question: '我希望沟通时更直接。', answer: '可以先说清一个具体需求。', guidedQuestion: null }];
  for (const mode of ['natal', 'synastry']) {
    const body = { schemaVersion: 2, system: 'ASTROLOGY', mode, locale: 'zh', birth, partnerBirth, topic: 'communication', question: '怎样改善沟通？' };
    const baseline = normalizeDeepRequest(body, env, now);
    const updated = normalizeDeepRequest({ ...body, followupQuestion: '如果对方一直没有回应呢？', conversation,
      chart: { fakePlanet: 'CLIENT_INVENTED_CHART' } }, env, now);
    assert.equal(baseline.followup, false);
    assert.equal(updated.followup, true);
    assert.equal(updated.userContent.question, body.question);
    assert.equal(updated.userContent.followupQuestion, '如果对方一直没有回应呢？');
    assert.deepEqual(updated.userContent.conversation, conversation);
    assert.deepEqual(updated.reference, baseline.reference);
    assert(!JSON.stringify(updated.reference).includes('CLIENT_INVENTED_CHART'));
    assert(!JSON.stringify(updated.reference).includes(conversation[0].answer));
    assert.throws(() => normalizeDeepRequest({ ...body, followupQuestion: '太短' }, env, now), /INVALID_QUESTION/);
    assert.throws(() => normalizeDeepRequest({ ...body, followupQuestion: '如果对方一直没有回应呢？', conversation: Array(5).fill(conversation[0]) }, env, now), /INVALID_CONVERSATION/);
  }
});
