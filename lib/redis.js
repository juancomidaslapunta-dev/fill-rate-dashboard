// lib/redis.js
// Cliente centralizado de Upstash Redis. La integración de Upstash en Vercel
// inyecta automáticamente KV_REST_API_URL y KV_REST_API_TOKEN (o, si se
// conectó manualmente, UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
// Redis.fromEnv() detecta cualquiera de los dos pares automáticamente.

const { Redis } = require('@upstash/redis');

let _client = null;

function getRedis() {
  if (_client) return _client;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'No se encontró configuración de Redis. Conecta una base de datos Upstash Redis ' +
      'a este proyecto en Vercel (Storage → Marketplace → Upstash Redis) y vuelve a desplegar.'
    );
  }

  _client = new Redis({ url, token });
  return _client;
}

module.exports = { getRedis };
