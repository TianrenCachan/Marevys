'use strict';
const { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, randomUUID } = require('node:crypto');
const { ReadingError } = require('./reading.cjs');
const DAY = 86400000;
const DEV_SECRET = randomBytes(32);
const AAD = Buffer.from('marevys:tarot-session:v2');
const locales = ['en', 'fr', 'zh'];
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const position = (id, en, fr, zh) => ({ id, name: { en, fr, zh } });
const SPREADS = Object.freeze({
  one: [position('focus', 'Your focus', 'Votre point de repère', '此刻的重点')],
  three: [position('situation', 'The situation', 'La situation', '当前处境'), position('obstacle', 'The obstacle', 'Le point de tension', '关键阻碍'), position('action', 'Your next step', 'Votre prochain pas', '可采取的行动')],
  five: [position('theme', 'The central question', 'Le cœur de la question', '核心课题'), position('obstacle', 'The obstacle', 'Le point de tension', '关键阻碍'), position('opportunity', 'The opportunity', 'Une ouverture', '可把握的机会'), position('support', 'Your support', 'Un appui', '可用的支持'), position('perspective', 'The wider perspective', 'Une vue plus large', '更大的课题')]
});
const CLARIFIER = position('clarifier', 'A clarifying perspective', 'Un éclairage complémentaire', '补充线索');
function assert(condition, code = 'INVALID_REQUEST', status = 400) { if (!condition) throw new ReadingError(status, code); }
function text(value, max, min = 0, code = 'INVALID_REQUEST') {
  assert(typeof value === 'string' && value.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value), code);
  const trimmed = value.trim(); assert(trimmed.length >= min, code); return trimmed;
}
function production(env) { return env.VERCEL === '1' || env.NODE_ENV === 'production'; }
function sessionKey(env = process.env) {
  const secret = env.SESSION_SECRET || env.RATE_LIMIT_SALT;
  if (!secret && !production(env)) return createHash('sha256').update(AAD).update(DEV_SECRET).digest();
  assert(typeof secret === 'string' && secret.trim().length >= 32, 'SESSION_NOT_CONFIGURED', 503);
  return createHash('sha256').update(AAD).update(secret).digest();
}
function encryptSession(session, env = process.env) {
  const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', sessionKey(env), nonce);
  cipher.setAAD(AAD);
  // Compact the private deck so even maximum-length Chinese context + followup fits the body limit.
  const packed = { ...session, deck: session.deck.map(card => Number(card.id.slice(6)) * 2 + (card.orientation === 'reversed' ? 1 : 0)) };
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(packed), 'utf8'), cipher.final()]);
  return ['v2', nonce.toString('base64url'), encrypted.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
}
function decryptSession(token, env = process.env, now = Date.now()) {
  const key = sessionKey(env);
  assert(typeof token === 'string' && token.length <= 32000 && /^v2\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token), 'INVALID_SESSION');
  let session;
  try {
    const [, iv, payload, tag] = token.split('.');
    const nonce = Buffer.from(iv, 'base64url'), authTag = Buffer.from(tag, 'base64url');
    assert(nonce.length === 12 && authTag.length === 16, 'INVALID_SESSION');
    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAAD(AAD); decipher.setAuthTag(authTag);
    session = JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload, 'base64url')), decipher.final()]).toString('utf8'));
    assert(Array.isArray(session.deck) && session.deck.length === 78 && session.deck.every(value => Number.isInteger(value) && value >= 0 && value < 156), 'INVALID_SESSION');
    session.deck = session.deck.map(value => ({ id: `TAROT_${String(Math.floor(value / 2)).padStart(2, '0')}`, orientation: value % 2 ? 'reversed' : 'upright' }));
  } catch { throw new ReadingError(400, 'INVALID_SESSION'); }
  assert(object(session) && session.version === 2 && typeof session.readingId === 'string' && locales.includes(session.context?.locale), 'INVALID_SESSION');
  assert(Number.isSafeInteger(session.expiresAt) && session.expiresAt > now, 'SESSION_EXPIRED', 410);
  assert(Object.hasOwn(SPREADS, session.context.spreadId) && Array.isArray(session.deck) && session.deck.length === 78, 'INVALID_SESSION');
  assert(session.deck.every(card => object(card) && /^TAROT_\d{2}$/.test(card.id) && Number(card.id.slice(6)) < 78 && ['upright', 'reversed'].includes(card.orientation)) && new Set(session.deck.map(card => card.id)).size === 78, 'INVALID_SESSION');
  assert(Array.isArray(session.indices) && [0, SPREADS[session.context.spreadId].length].includes(session.indices.length), 'INVALID_SESSION');
  assert(session.indices.every(i => Number.isInteger(i) && i >= 0 && i < 78) && new Set(session.indices).size === session.indices.length, 'INVALID_SESSION');
  return session;
}
function startSession(raw, now = Date.now()) {
  assert(object(raw) && locales.includes(raw.locale), 'INVALID_LOCALE');
  assert(Object.hasOwn(SPREADS, raw.spreadId), 'INVALID_SPREAD');
  assert(typeof raw.usesReversals === 'boolean', 'INVALID_REVERSALS');
  const context = { locale: raw.locale, question: text(raw.question, 2000, 5, 'INVALID_QUESTION'),
    background: text(raw.background === undefined ? '' : raw.background, 3000, 0, 'INVALID_BACKGROUND'),
    timeframe: text(raw.timeframe, 160, 1, 'INVALID_TIMEFRAME'), spreadId: raw.spreadId, usesReversals: raw.usesReversals };
  const deck = Array.from({ length: 78 }, (_, i) => ({ id: `TAROT_${String(i).padStart(2, '0')}`, orientation: context.usesReversals && randomInt(2) === 1 ? 'reversed' : 'upright' }));
  // Fisher–Yates with node:crypto rejection sampling: unbiased, independently shuffled sessions.
  for (let i = deck.length - 1; i > 0; i--) { const j = randomInt(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return { version: 2, readingId: randomUUID(), issuedAt: now, expiresAt: now + 7 * DAY, context, deck, indices: [], clarifierQuestion: null };
}
function revealSession(session, indices) {
  const count = SPREADS[session.context.spreadId].length;
  assert(Array.isArray(indices) && indices.length === count && indices.every(i => Number.isInteger(i) && i >= 0 && i < 78) && new Set(indices).size === count, 'INVALID_SELECTION');
  if (session.indices.length) { assert(JSON.stringify(indices) === JSON.stringify(session.indices), 'DRAW_ALREADY_FIXED', 409); return session; }
  return { ...session, indices: [...indices] };
}
function clarifySession(session, question) {
  assert(session.indices.length > 0, 'DRAW_REQUIRED');
  const normalized = text(question, 1000, 5, 'INVALID_CLARIFIER');
  if (session.clarifierQuestion !== null) { assert(session.clarifierQuestion === normalized, 'CLARIFIER_ALREADY_USED', 409); return session; }
  // Always take the first remaining card in the original shuffled deck. Replay cannot reroll it.
  return { ...session, clarifierQuestion: normalized };
}
function drawnCards(session) {
  const catalog = require('./tarot-cards.json');
  const records = Array.isArray(catalog) ? catalog : catalog.cards;
  const positions = SPREADS[session.context.spreadId];
  const indices = [...session.indices];
  if (session.clarifierQuestion !== null) indices.push(session.deck.findIndex((_, i) => !session.indices.includes(i)));
  return indices.map((index, i) => {
    const card = session.deck[index], record = records.find(item => item.id === card.id), p = positions[i] || CLARIFIER;
    assert(record, 'CATALOG_UNAVAILABLE', 503);
    return { id: card.id, orientation: card.orientation, positionId: p.id, position: p.name, name: record.name };
  });
}
function publicSession(session, token) {
  return { schemaVersion: 2, token, readingId: session.readingId,
    status: session.clarifierQuestion !== null ? 'clarified' : session.indices.length ? 'revealed' : 'shuffled',
    context: { ...session.context, positions: SPREADS[session.context.spreadId] }, cardCount: 78, expiresAt: session.expiresAt,
    ...(session.indices.length ? { cards: drawnCards(session) } : {}), clarifierQuestion: session.clarifierQuestion };
}
module.exports = { SPREADS, CLARIFIER, DAY, production, sessionKey, encryptSession, decryptSession, startSession, revealSession, clarifySession, drawnCards, publicSession, text, assert };
