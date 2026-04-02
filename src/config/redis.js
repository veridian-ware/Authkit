const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

module.exports = redisClient;
