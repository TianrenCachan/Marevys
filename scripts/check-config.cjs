'use strict';
const required=['OPENAI_API_KEY','OPENAI_MODEL','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','RATE_LIMIT_SALT'];
let missing=0;
for(const key of required){const ok=Boolean(process.env[key]?.trim());console.log(`${key}: ${ok?'configured':'missing'}`);if(!ok)missing++;}
console.log(missing?'AI remains disabled; the website will use local readings.':'Configuration present. A live request is still needed to verify credentials and model access.');
process.exitCode=missing?1:0;
