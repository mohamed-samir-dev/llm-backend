const Redis = require('ioredis');
const config = require('./index');

const redis = new Redis(config.redis.url, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

// Separate connection for BullMQ (requires maxRetriesPerRequest: null)
const bullmqConnection = new Redis(config.redis.url, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: null,
});

bullmqConnection.on('error', (err) => console.error('❌ BullMQ Redis error:', err.message));

module.exports = redis;
module.exports.bullmqConnection = bullmqConnection;
