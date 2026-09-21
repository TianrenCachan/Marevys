'use strict';
const { randomUUID } = require('node:crypto');
const { ReadingError } = require('../server/reading.cjs');
const { checkOrigin, readBody } = require('./reading.js');
const { redisCommand } = require('../server/rate-limit.cjs');
const { production, encryptSession, decryptSession, startSession, revealSession, clarifySession, publicSession } = require('../server/tarot-engine.cjs');
const CAS_LUA = `local current = redis.call('GET', KEYS[1])
if not current then return false end
if current == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2], 'KEEPTTL'); return ARGV[2] end
return current`;

function sessionStore(env, fetchImpl, now) {
  if (!production(env) && env.TAROT_SESSION_STORAGE !== 'redis') {
    const sessions = new Map();
    return {
      async create(id, token, expiresAt) {
        for (const [key, item] of sessions) if (item.expiresAt <= now()) sessions.delete(key);
        if (sessions.size >= 2000) throw new ReadingError(503, 'SESSION_STORE_BUSY');
        sessions.set(id, { token, expiresAt });
      },
      async get(id) { const item = sessions.get(id); return item && item.expiresAt > now() ? item.token : null; },
      async transition(id, previous, next) {
        const item = sessions.get(id); if (!item || item.expiresAt <= now()) return null;
        if (item.token === previous) item.token = next;
        return item.token;
      }
    };
  }
  let url;
  try { url = new URL(env.UPSTASH_REDIS_REST_URL); } catch { throw new ReadingError(503, 'SESSION_NOT_CONFIGURED'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.upstash.io') || url.username || url.password || url.port || url.search || url.hash || !env.UPSTASH_REDIS_REST_TOKEN) throw new ReadingError(503, 'SESSION_NOT_CONFIGURED');
  const config = { redisUrl: url.href, redisToken: env.UPSTASH_REDIS_REST_TOKEN };
  const key = id => `marevys:tarot:v2:${id}`;
  return {
    async create(id, token, expiresAt) {
      const result = await redisCommand(fetchImpl, config, ['SET', key(id), token, 'NX', 'EX', Math.max(1, Math.ceil((expiresAt - now()) / 1000))]);
      if (result !== 'OK') throw new ReadingError(503, 'SESSION_STORE_BUSY');
    },
    get: id => redisCommand(fetchImpl, config, ['GET', key(id)]),
    transition: (id, previous, next) => redisCommand(fetchImpl, config, ['EVAL', CAS_LUA, 1, key(id), previous, next])
  };
}
function createHandler({ env = process.env, fetchImpl = globalThis.fetch, now = Date.now, store } = {}) {
  let storage = store;
  return async function tarot(req, res) {
    const requestId = randomUUID();
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Request-Id', requestId);
    const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    try {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new ReadingError(405, 'METHOD_NOT_ALLOWED'); }
      checkOrigin(req, env);
      const body = await readBody(req);
      if (!body || typeof body !== 'object' || !['start', 'reveal', 'clarify'].includes(body.action)) throw new ReadingError(400, 'INVALID_ACTION');
      if (!storage) storage = sessionStore(env, fetchImpl, now);
      if (body.action === 'start') {
        const session = startSession(body, now()), token = encryptSession(session, env);
        await storage.create(session.readingId, token, session.expiresAt);
        return send(200, publicSession(session, token));
      }
      const supplied = decryptSession(body.token, env, now());
      const currentToken = await storage.get(supplied.readingId);
      if (typeof currentToken !== 'string') throw new ReadingError(410, 'SESSION_EXPIRED');
      const current = decryptSession(currentToken, env, now());
      const transition = session => body.action === 'reveal' ? revealSession(session, body.indices) : clarifySession(session, body.question);
      const next = transition(current);
      if (next === current) return send(200, publicSession(current, currentToken));
      const nextToken = encryptSession(next, env);
      const committedToken = await storage.transition(current.readingId, currentToken, nextToken);
      if (typeof committedToken !== 'string') throw new ReadingError(410, 'SESSION_EXPIRED');
      const committed = decryptSession(committedToken, env, now());
      // A racing request may have committed first; verify it is the same selection/question.
      transition(committed);
      send(200, publicSession(committed, committedToken));
    } catch (error) {
      const safe = error instanceof ReadingError ? error : new ReadingError(503, 'SESSION_UNAVAILABLE');
      send(safe.status, { error: { code: safe.code }, requestId });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.sessionStore = sessionStore;
module.exports.CAS_LUA = CAS_LUA;
