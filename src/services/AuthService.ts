import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { query, queryOne } from '../database';
import { sessionStore, deviceStore } from '../database/redis';
import { hashApiKey, generateRandomString } from '../utils/crypto';
import { log } from '../utils';
import { ApiKey } from '../types';

// JWT payload
export interface JWTPayload {
  userId: string;
  deviceId?: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  // 验证 API Key 并创建会话
  async authenticateWithApiKey(
    key: string,
    deviceId?: string,
    _clientType: 'app' | 'claw' = 'app'
  ): Promise<{ token: string; userId: string; expiresAt: number } | null> {
    try {
      // 查找 API Key
      const apiKeyRecord = await queryOne<ApiKey>(
        `SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = true AND expires_at > NOW()`,
        [await hashApiKey(key)]
      );

      if (!apiKeyRecord) {
        log.warn('Invalid API Key attempt');
        return null;
      }

      // 更新最后使用时间
      await query(
        `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
        [apiKeyRecord.id]
      );

      // 创建会话
      const token = await generateRandomString(32);
      const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7天

      // 存储到 Redis
      await sessionStore.set(token, apiKeyRecord.userId, 7 * 24 * 60 * 60);

      // 如果有设备ID，标记设备在线
      if (deviceId) {
        await deviceStore.setOnline(deviceId, apiKeyRecord.userId);
      }

      log.info(`User ${apiKeyRecord.userId} authenticated via API key, device: ${deviceId}`);

      return {
        token,
        userId: apiKeyRecord.userId,
        expiresAt,
      };
    } catch (error) {
      log.error('Authentication error', error);
      return null;
    }
  }

  // 验证 JWT Token
  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      // 先从 Redis 检查会话是否存在
      const userId = await sessionStore.get(token);
      if (!userId) {
        return null;
      }

      // 解析 JWT（这里简化处理，实际可以存储完整payload）
      const payload: JWTPayload = {
        userId,
        sessionId: token,
        type: 'access',
      };

      return payload;
    } catch (error) {
      log.error('Token verification error', error);
      return null;
    }
  }

  // 创建 API Key
  async createApiKey(
    userId: string,
    name: string,
    permissions: Record<string, any> = {}
  ): Promise<string> {
    const key = `oc_${generateRandomString(32)}`;
    const keyHash = await hashApiKey(key);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.api.keyExpiresDays);

    await query(
      `INSERT INTO api_keys (id, key_hash, user_id, name, permissions, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), keyHash, userId, name, JSON.stringify(permissions), expiresAt]
    );

    log.info(`Created new API key for user ${userId}: ${name}`);
    return key;
  }

  // 删除 API Key
  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    await query(
      `UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2`,
      [keyId, userId]
    );
    return true;
  }

  // 获取用户的 API Keys
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return query(
      `SELECT id, user_id, name, permissions, created_at, expires_at, last_used_at, is_active
       FROM api_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [userId]
    );
  }

  // 登出
  async logout(token: string, deviceId?: string): Promise<void> {
    await sessionStore.delete(token);
    
    if (deviceId) {
      await deviceStore.setOffline(deviceId);
    }
    
    log.info(`Session logged out, device: ${deviceId}`);
  }

  // 刷新 Token
  async refreshToken(oldToken: string): Promise<{ token: string; expiresAt: number } | null> {
    const payload = await this.verifyToken(oldToken);
    if (!payload) {
      return null;
    }

    // 删除旧会话
    await sessionStore.delete(oldToken);

    // 创建新会话
    const newToken = await generateRandomString(32);
    const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

    await sessionStore.set(newToken, payload.userId, 7 * 24 * 60 * 60);

    return { token: newToken, expiresAt };
  }
}

export default new AuthService();
