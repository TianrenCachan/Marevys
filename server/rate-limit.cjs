'use strict';
const { createHmac, randomUUID } = require('node:crypto');
const { isIP } = require('node:net');
const { ReadingError } = require('./reading.cjs');

// One atomic reservation enforces both daily caps and concurrent request leases.
const RESERVE_LUA = `
local now = tonumber(ARGV[1])
redis.call('ZREMRANGEBYSCORE', KEYS[3], '-inf', now)
if tonumber(redis.call('GET', KEYS[1]) or '0') >= tonumber(ARGV[2]) then return {0, 'IP_DAILY', ARGV[6]} end
if tonumber(redis.call('GET', KEYS[2]) or '0') >= tonumber(ARGV[3]) then return {0, 'GLOBAL_DAILY', ARGV[6]} end
if redis.call('ZCARD', KEYS[3]) >= tonumber(ARGV[4]) then return {0, 'CONCURRENCY', 10} end
redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[6]) + 60)
redis.call('INCR', KEYS[2])
redis.call('EXPIRE', KEYS[2], tonumber(ARGV[6]) + 60)
redis.call('ZADD', KEYS[3], now + 55000, ARGV[5])
redis.call('EXPIRE', KEYS[3], 60)
return {1, 'OK', 0}`;

function clientIdentifier(req, config) {
  // x-forwarded-for is client-controlled outside the Vercel platform. Never use it.
  let address = 'local';
  if (config.vercel) {
    const trusted = req.headers['x-vercel-forwarded-for'];
    if (typeof trusted !== 'string' || trusted.includes(',') || !isIP(trusted.trim())) throw new ReadingError(503, 'CLIENT_ADDRESS_UNAVAILABLE');
    address = trusted.trim();
  }
  return createHmac('sha256', config.salt).update(address).digest('hex');
}

async function redisCommand(fetchImpl, config, command, timeoutMs = 3000) {
  const controller = new AbortController();
  let timer;
  try {
    const operation = async () => {
      const response = await fetchImpl(config.redisUrl, { method: 'POST', headers: { Authorization: `Bearer ${config.redisToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: controller.signal });
      if (!response.ok) throw new ReadingError(503, 'LIMITER_UNAVAILABLE');
      const raw = await response.json();
      if (!raw || raw.error || !Object.hasOwn(raw, 'result')) throw new ReadingError(503, 'LIMITER_UNAVAILABLE');
      return raw.result;
    };
    return await Promise.race([
      operation(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ReadingError(503, 'LIMITER_UNAVAILABLE')); }, timeoutMs); })
    ]);
  } catch { throw new ReadingError(503, 'LIMITER_UNAVAILABLE'); }
  finally { clearTimeout(timer); }
}

async function reserve(fetchImpl, req, config, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const untilTomorrow = Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86400000 - now) / 1000);
  const identity = clientIdentifier(req, config);
  const lease = randomUUID(), leaseKey = 'marevys:{ai}:leases';
  const result = await redisCommand(fetchImpl, config, ['EVAL', RESERVE_LUA, 3,
    `marevys:{ai}:ip:${day}:${identity}`, `marevys:{ai}:daily:${day}`, leaseKey,
    now, config.ipDailyLimit, config.dailyLimit, config.maxConcurrent, lease, untilTomorrow]);
  if (!Array.isArray(result) || result.length !== 3 || ![0, 1].includes(Number(result[0]))) throw new ReadingError(503, 'LIMITER_UNAVAILABLE');
  if (Number(result[0]) !== 1) {
    const error = new ReadingError(429, 'RATE_LIMITED');
    error.retryAfter = Math.min(86400, Math.max(1, Number(result[2]) || 60));
    throw error;
  }
  return { identity, release: () => redisCommand(fetchImpl, config, ['ZREM', leaseKey, lease], 1000) };
}
module.exports = { RESERVE_LUA, clientIdentifier, redisCommand, reserve };
