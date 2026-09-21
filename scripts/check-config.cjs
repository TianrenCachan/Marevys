'use strict';
const { configuration } = require('../api/reading.js');
const { sessionKey } = require('../server/tarot-engine.cjs');
const { sessionStore } = require('../api/tarot.js');
const required = ['OPENAI_API_KEY','OPENAI_MODEL','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','RATE_LIMIT_SALT'];
for (const key of required) console.log(`${key}: ${process.env[key]?.trim() ? 'present' : 'missing'}`);
console.log(`SESSION_SECRET: ${process.env.SESSION_SECRET?.trim() ? 'present (dedicated)' : 'not set (RATE_LIMIT_SALT fallback)'}`);
let aiReady = false, sessionReady = false;
try { configuration(process.env); aiReady = true; } catch {}
try {
  const productionEnv = { ...process.env, NODE_ENV: 'production' };
  sessionKey(productionEnv);
  // Adapter construction validates configuration without making network calls.
  sessionStore(productionEnv, globalThis.fetch, Date.now);
  sessionReady = true;
} catch {}
console.log(`AI configuration format: ${aiReady ? 'valid' : 'missing or invalid'}`);
console.log(`Production Tarot session configuration format: ${sessionReady ? 'valid' : 'missing or invalid'}`);
console.log('No credentials, model access, Redis connectivity or deployed site were verified by this check.');
if (!aiReady) console.log('Deep AI readings remain unavailable. Basic card references and calculated natal charts are separate, clearly labelled features.');
if (!sessionReady) console.log('Production Tarot draws remain unavailable. Local development may use a temporary in-process session store.');
process.exitCode = aiReady && sessionReady ? 0 : 1;
