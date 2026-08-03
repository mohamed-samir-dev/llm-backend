const Redis = require('ioredis');
const config = require('./index');

let redis = null;
let bullmqConnection = null;
let redisAvailable = false;

const testConnection = () => new Promise((resolve) => {
  const client = new Redis(config.redis.url, { retryStrategy: () => null, connectTimeout: 2000, lazyConnect: true });
  client.on('error', () => {});
  client.connect()
    .then(() => { redisAvailable = true; client.disconnect(); resolve(true); })
    .catch(() => { resolve(false); });
});

const init = async () => {
  const ok = await testConnection();
  if (!ok) {
    console.warn('⚠️  Redis unavailable — running without cache/queues');
    return;
  }
  redis = new Redis(config.redis.url, { retryStrategy: () => null, maxRetriesPerRequest: 1 });
  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', () => {});

  bullmqConnection = new Redis(config.redis.url, { retryStrategy: () => null, maxRetriesPerRequest: null, enableOfflineQueue: false });
  bullmqConnection.on('error', () => {});
  redisAvailable = true;
};

// Safe redis proxy — silently no-ops if redis is down
const safeRedis = new Proxy({}, {
  get: (_, prop) => async () => null,
});

module.exports = {
  init,
  get redis() { return redis || safeRedis; },
  get bullmqConnection() { return bullmqConnection; },
  get redisAvailable() { return redisAvailable; },
};
