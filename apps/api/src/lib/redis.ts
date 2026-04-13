import Redis from 'ioredis';

let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message);
    });
  } else {
    console.warn('[Redis] REDIS_URL not set — caching disabled');
  }
} catch (err) {
  console.warn('[Redis] Failed to initialize:', err);
}

export { redis };
