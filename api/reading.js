'use strict';
const { randomUUID } = require('node:crypto');
const { ReadingError, normalizeRequest, responseSchema, validateResponse, INSTRUCTIONS } = require('../server/reading.cjs');
const { reserve } = require('../server/rate-limit.cjs');
const { normalizeDeepRequest, requestDeepReading } = require('../server/deep-reading.cjs');
const MAX_BODY = 32 * 1024;
const REQUIRED = ['OPENAI_API_KEY', 'OPENAI_MODEL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_SALT'];

function configuration(env) {
  if (REQUIRED.some(key => typeof env[key] !== 'string' || !env[key].trim())) throw new ReadingError(503, 'AI_NOT_CONFIGURED');
  let redis;
  try { redis = new URL(env.UPSTASH_REDIS_REST_URL); } catch { throw new ReadingError(503, 'AI_NOT_CONFIGURED'); }
  if (redis.protocol !== 'https:' || redis.username || redis.password || !redis.hostname.endsWith('.upstash.io') || redis.port || redis.search || redis.hash) throw new ReadingError(503, 'AI_NOT_CONFIGURED');
  if (env.RATE_LIMIT_SALT.length < 32 || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(env.OPENAI_MODEL)) throw new ReadingError(503, 'AI_NOT_CONFIGURED');
  const integer = (key, fallback, max) => {
    if (env[key] === undefined || env[key] === '') return fallback;
    const value = Number(env[key]);
    if (!Number.isSafeInteger(value) || value < 1 || value > max) throw new ReadingError(503, 'AI_NOT_CONFIGURED');
    return value;
  };
  return { apiKey: env.OPENAI_API_KEY.trim(), model: env.OPENAI_MODEL.trim(), redisUrl: redis.href, redisToken: env.UPSTASH_REDIS_REST_TOKEN,
    salt: env.RATE_LIMIT_SALT, vercel: env.VERCEL === '1', dailyLimit: integer('AI_DAILY_REQUEST_LIMIT', 100, 100000),
    ipDailyLimit: integer('AI_IP_DAILY_LIMIT', 3, 1000), maxConcurrent: integer('AI_MAX_CONCURRENT', 4, 100) };
}

function checkOrigin(req, env) {
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new ReadingError(403, 'ORIGIN_DENIED');
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || origin === 'null') throw new ReadingError(403, 'ORIGIN_DENIED');
  let parsed;
  try { parsed = new URL(origin); } catch { throw new ReadingError(403, 'ORIGIN_DENIED'); }
  if (parsed.origin !== origin || parsed.username || parsed.password) throw new ReadingError(403, 'ORIGIN_DENIED');
  const host = req.headers.host;
  if (typeof host !== 'string' || !host || /[\s/\\]/.test(host)) throw new ReadingError(403, 'ORIGIN_DENIED');
  const local = env.VERCEL !== '1' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  const sameOrigin = parsed.host === host && (parsed.protocol === 'https:' || (local && parsed.protocol === 'http:'));
  const configured = (env.AI_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!sameOrigin && !configured.includes(origin)) throw new ReadingError(403, 'ORIGIN_DENIED');
}

async function readBody(req) {
  const contentType = req.headers['content-type'];
  if (typeof contentType !== 'string' || !/^application\/json(?:\s*;|$)/i.test(contentType)) throw new ReadingError(415, 'JSON_REQUIRED');
  const advertised = req.headers['content-length'];
  if (advertised !== undefined && (!/^\d+$/.test(String(advertised)) || Number(advertised) > MAX_BODY)) throw new ReadingError(413, 'BODY_TOO_LARGE');
  let raw = req.body;
  if (raw === undefined) {
    const chunks = []; let total = 0;
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += bytes.length; if (total > MAX_BODY) throw new ReadingError(413, 'BODY_TOO_LARGE');
      chunks.push(bytes);
    }
    raw = Buffer.concat(chunks);
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  if (typeof raw !== 'string') {
    try { raw = JSON.stringify(raw); } catch { throw new ReadingError(400, 'INVALID_JSON'); }
  }
  if (typeof raw !== 'string') throw new ReadingError(400, 'INVALID_JSON');
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY) throw new ReadingError(413, 'BODY_TOO_LARGE');
  try { return JSON.parse(raw); } catch { throw new ReadingError(400, 'INVALID_JSON'); }
}

async function requestOpenAI(fetchImpl, input, config, identity, timeoutMs) {
  const controller = new AbortController(); let timer;
  const { question, ...reference } = input;
  const operation = async () => {
    const response = await fetchImpl('https://api.openai.com/v1/responses', { method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.model, store: false, max_output_tokens: 5500, safety_identifier: identity,
        instructions: INSTRUCTIONS,
        input: [{ role: 'developer', content: 'Server-verified references and interpretation context:\n' + JSON.stringify(reference) },
          { role: 'user', content: JSON.stringify({ untrustedVisitorQuestion: question }) }],
        text: { format: { type: 'json_schema', name: input.system === 'RUNES' ? 'marevys_rune_reading' : 'marevys_oracle_reading', strict: true, schema: responseSchema(input) } } }) });
    if (!response.ok) throw new ReadingError(response.status === 429 ? 503 : 502, 'AI_PROVIDER_UNAVAILABLE');
    const raw = await response.json();
    if (!raw || raw.status !== 'completed' || !Array.isArray(raw.output)) throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    const messages = raw.output.filter(item => item.type === 'message');
    const parts = messages.flatMap(item => Array.isArray(item.content) ? item.content : []);
    if (parts.some(part => part.type === 'refusal')) throw new ReadingError(502, 'AI_RESPONSE_UNAVAILABLE');
    const texts = parts.filter(part => part.type === 'output_text');
    if (texts.length !== 1 || typeof texts[0].text !== 'string' || Buffer.byteLength(texts[0].text) > 65536) throw new ReadingError(502, 'INVALID_AI_RESPONSE');
    let value; try { value = JSON.parse(texts[0].text); } catch { throw new ReadingError(502, 'INVALID_AI_RESPONSE'); }
    return validateResponse(value, input);
  };
  try {
    return await Promise.race([operation(), new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new ReadingError(504, 'AI_TIMEOUT')); }, timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

function createHandler({ env = process.env, fetchImpl = globalThis.fetch, now = Date.now, aiTimeoutMs } = {}) {
  return async function reading(req, res) {
    const requestId = randomUUID();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Request-Id', requestId);
    const send = (status, value) => { res.statusCode = status; res.end(JSON.stringify(value)); };
    let reservation;
    try {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); throw new ReadingError(405, 'METHOD_NOT_ALLOWED'); }
      checkOrigin(req, env);
      const body = await readBody(req);
      const deep = body?.schemaVersion === 2;
      const input = deep ? normalizeDeepRequest(body, env, now()) : normalizeRequest(body);
      const config = configuration(env);
      reservation = await reserve(fetchImpl, req, config, now());
      const timeout = aiTimeoutMs === undefined ? (deep ? 45000 : 30000) : aiTimeoutMs;
      const value = await (deep ? requestDeepReading : requestOpenAI)(fetchImpl, input, config, reservation.identity, timeout);
      send(200, value);
    } catch (error) {
      const safe = error instanceof ReadingError ? error : new ReadingError(502, 'AI_UNAVAILABLE');
      if (safe.retryAfter) res.setHeader('Retry-After', String(safe.retryAfter));
      send(safe.status, { error: { code: safe.code }, requestId });
    } finally {
      // A failed release expires automatically. Daily reservations are intentionally not refunded.
      if (reservation) { try { await reservation.release(); } catch {} }
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.configuration = configuration;
module.exports.checkOrigin = checkOrigin;
module.exports.readBody = readBody;
module.exports.requestOpenAI = requestOpenAI;
