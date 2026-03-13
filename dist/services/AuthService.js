"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const database_1 = require("../database");
const redis_1 = require("../database/redis");
const crypto_1 = require("../utils/crypto");
const utils_1 = require("../utils");
class AuthService {
    // 验证 API Key 并创建会话
    async authenticateWithApiKey(key, deviceId, _clientType = 'app') {
        try {
            // 查找 API Key
            const apiKeyRecord = await (0, database_1.queryOne)(`SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true AND expires_at > NOW()`, [await (0, crypto_1.hashApiKey)(key)]);
            if (!apiKeyRecord) {
                utils_1.log.warn('Invalid API Key attempt');
                return null;
            }
            // 更新最后使用时间
            await (0, database_1.query)(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [apiKeyRecord.id]);
            // 创建会话
            const token = await (0, crypto_1.generateRandomString)(32);
            const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7天
            // 存储到 Redis
            await redis_1.sessionStore.set(token, apiKeyRecord.userId, 7 * 24 * 60 * 60);
            // 如果有设备ID，标记设备在线
            if (deviceId) {
                await redis_1.deviceStore.setOnline(deviceId, apiKeyRecord.userId);
            }
            utils_1.log.info(`User ${apiKeyRecord.userId} authenticated via API key, device: ${deviceId}`);
            return {
                token,
                userId: apiKeyRecord.userId,
                expiresAt,
            };
        }
        catch (error) {
            utils_1.log.error('Authentication error', error);
            return null;
        }
    }
    // 验证 JWT Token
    async verifyToken(token) {
        try {
            // 先从 Redis 检查会话是否存在
            const userId = await redis_1.sessionStore.get(token);
            if (!userId) {
                return null;
            }
            // 解析 JWT（这里简化处理，实际可以存储完整payload）
            const payload = {
                userId,
                sessionId: token,
                type: 'access',
            };
            return payload;
        }
        catch (error) {
            utils_1.log.error('Token verification error', error);
            return null;
        }
    }
    // 创建 API Key
    async createApiKey(userId, name, permissions = {}) {
        const key = `oc_${(0, crypto_1.generateRandomString)(32)}`;
        const keyHash = await (0, crypto_1.hashApiKey)(key);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config_1.default.api.keyExpiresDays);
        await (0, database_1.query)(`INSERT INTO api_keys (id, key_hash, user_id, name, permissions, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [(0, uuid_1.v4)(), keyHash, userId, name, JSON.stringify(permissions), expiresAt]);
        utils_1.log.info(`Created new API key for user ${userId}: ${name}`);
        return key;
    }
    // 删除 API Key
    async deleteApiKey(keyId, userId) {
        await (0, database_1.query)(`UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2`, [keyId, userId]);
        return true;
    }
    // 获取用户的 API Keys
    async getApiKeys(userId) {
        return (0, database_1.query)(`SELECT id, user_id, name, permissions, created_at, expires_at, last_used_at, is_active
       FROM api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`, [userId]);
    }
    // 登出
    async logout(token, deviceId) {
        await redis_1.sessionStore.delete(token);
        if (deviceId) {
            await redis_1.deviceStore.setOffline(deviceId);
        }
        utils_1.log.info(`Session logged out, device: ${deviceId}`);
    }
    // 刷新 Token
    async refreshToken(oldToken) {
        const payload = await this.verifyToken(oldToken);
        if (!payload) {
            return null;
        }
        // 删除旧会话
        await redis_1.sessionStore.delete(oldToken);
        // 创建新会话
        const newToken = await (0, crypto_1.generateRandomString)(32);
        const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
        await redis_1.sessionStore.set(newToken, payload.userId, 7 * 24 * 60 * 60);
        return { token: newToken, expiresAt };
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
//# sourceMappingURL=AuthService.js.map