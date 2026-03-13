import Redis from 'ioredis';
import config from '../config';
import { log } from '../utils';

let redisClient: Redis | null = null;

// 初始化 Redis 连接
export async function initRedis(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => {
    log.info('Redis connection established');
  });

  redisClient.on('error', (err) => {
    log.error('Redis connection error', err);
  });

  return redisClient;
}

// 获取 Redis 客户端
export function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redisClient;
}

// 关闭 Redis 连接
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    log.info('Redis connection closed');
  }
}

// Session 相关操作
export const sessionStore = {
  // 存储会话
  async set(token: string, userId: string, expiresIn: number): Promise<void> {
    const redis = getRedis();
    await redis.setex(`session:${token}`, expiresIn, userId);
  },

  // 获取会话
  async get(token: string): Promise<string | null> {
    const redis = getRedis();
    return redis.get(`session:${token}`);
  },

  // 删除会话
  async delete(token: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`session:${token}`);
  },

  // 刷新会话过期时间
  async refresh(token: string, expiresIn: number): Promise<void> {
    const redis = getRedis();
    await redis.expire(`session:${token}`, expiresIn);
  },
};

// 在线设备相关操作
export const deviceStore = {
  // 设置设备在线
  async setOnline(deviceId: string, userId: string): Promise<void> {
    const redis = getRedis();
    await redis.set(`device:online:${deviceId}`, userId, 'EX', 300); // 5分钟过期
  },

  // 设置设备离线
  async setOffline(deviceId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`device:online:${deviceId}`);
  },

  // 检查设备是否在线
  async isOnline(deviceId: string): Promise<boolean> {
    const redis = getRedis();
    const result = await redis.exists(`device:online:${deviceId}`);
    return result === 1;
  },

  // 获取用户的所有在线设备
  async getUserOnlineDevices(userId: string): Promise<string[]> {
    const redis = getRedis();
    const keys = await redis.keys(`device:online:*`);
    const deviceIds: string[] = [];
    for (const key of keys) {
      const owner = await redis.get(key);
      if (owner === userId) {
        deviceIds.push(key.replace('device:online:', ''));
      }
    }
    return deviceIds;
  },
};

// 消息队列相关操作
export const messageQueue = {
  // 添加消息到队列
  async push(queueName: string, message: string): Promise<void> {
    const redis = getRedis();
    await redis.rpush(`queue:${queueName}`, message);
  },

  // 从队列获取消息
  async pop(queueName: string, timeout: number = 0): Promise<string | null> {
    const redis = getRedis();
    if (timeout > 0) {
      const result = await redis.blpop(`queue:${queueName}`, timeout);
      return result ? result[1] : null;
    }
    return redis.lpop(`queue:${queueName}`);
  },
};

// 限流相关操作
export const rateLimiter = {
  // 检查是否超过限制
  async check(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const redis = getRedis();
    const count = await redis.incr(`ratelimit:${key}`);
    if (count === 1) {
      await redis.expire(`ratelimit:${key}`, windowSeconds);
    }
    return count <= limit;
  },
};
