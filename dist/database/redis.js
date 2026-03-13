"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.messageQueue = exports.deviceStore = exports.sessionStore = void 0;
exports.initRedis = initRedis;
exports.getRedis = getRedis;
exports.closeRedis = closeRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = __importDefault(require("../config"));
const utils_1 = require("../utils");
let redisClient = null;
// 初始化 Redis 连接
async function initRedis() {
    if (redisClient) {
        return redisClient;
    }
    redisClient = new ioredis_1.default({
        host: config_1.default.redis.host,
        port: config_1.default.redis.port,
        password: config_1.default.redis.password || undefined,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    });
    redisClient.on('connect', () => {
        utils_1.log.info('Redis connection established');
    });
    redisClient.on('error', (err) => {
        utils_1.log.error('Redis connection error', err);
    });
    return redisClient;
}
// 获取 Redis 客户端
function getRedis() {
    if (!redisClient) {
        throw new Error('Redis not initialized. Call initRedis() first.');
    }
    return redisClient;
}
// 关闭 Redis 连接
async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        utils_1.log.info('Redis connection closed');
    }
}
// Session 相关操作
exports.sessionStore = {
    // 存储会话
    async set(token, userId, expiresIn) {
        const redis = getRedis();
        await redis.setex(`session:${token}`, expiresIn, userId);
    },
    // 获取会话
    async get(token) {
        const redis = getRedis();
        return redis.get(`session:${token}`);
    },
    // 删除会话
    async delete(token) {
        const redis = getRedis();
        await redis.del(`session:${token}`);
    },
    // 刷新会话过期时间
    async refresh(token, expiresIn) {
        const redis = getRedis();
        await redis.expire(`session:${token}`, expiresIn);
    },
};
// 在线设备相关操作
exports.deviceStore = {
    // 设置设备在线
    async setOnline(deviceId, userId) {
        const redis = getRedis();
        await redis.set(`device:online:${deviceId}`, userId, 'EX', 300); // 5分钟过期
    },
    // 设置设备离线
    async setOffline(deviceId) {
        const redis = getRedis();
        await redis.del(`device:online:${deviceId}`);
    },
    // 检查设备是否在线
    async isOnline(deviceId) {
        const redis = getRedis();
        const result = await redis.exists(`device:online:${deviceId}`);
        return result === 1;
    },
    // 获取用户的所有在线设备
    async getUserOnlineDevices(userId) {
        const redis = getRedis();
        const keys = await redis.keys(`device:online:*`);
        const deviceIds = [];
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
exports.messageQueue = {
    // 添加消息到队列
    async push(queueName, message) {
        const redis = getRedis();
        await redis.rpush(`queue:${queueName}`, message);
    },
    // 从队列获取消息
    async pop(queueName, timeout = 0) {
        const redis = getRedis();
        if (timeout > 0) {
            const result = await redis.blpop(`queue:${queueName}`, timeout);
            return result ? result[1] : null;
        }
        return redis.lpop(`queue:${queueName}`);
    },
};
// 限流相关操作
exports.rateLimiter = {
    // 检查是否超过限制
    async check(key, limit, windowSeconds) {
        const redis = getRedis();
        const count = await redis.incr(`ratelimit:${key}`);
        if (count === 1) {
            await redis.expire(`ratelimit:${key}`, windowSeconds);
        }
        return count <= limit;
    },
};
//# sourceMappingURL=redis.js.map