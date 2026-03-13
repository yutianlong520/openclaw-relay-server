import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../database';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { log } from '../utils';
import { User } from '../types';

// 用户服务
export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
}

// 用户登录返回
export interface LoginResult {
  user: User;
  token: string;
}

export class UserService {
  // 创建用户
  async createUser(data: CreateUserData): Promise<User> {
    const id = uuidv4();
    const passwordHash = await hashPassword(data.password);

    await query(
      `INSERT INTO users (id, username, email, password_hash, created_at, is_active)
       VALUES ($1, $2, $3, $4, NOW(), true)`,
      [id, data.username, data.email || null, passwordHash]
    );

    log.info(`User created: ${data.username}`);

    return {
      id,
      username: data.username,
      email: data.email,
      createdAt: new Date(),
      isActive: true,
    };
  }

  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    const row = await queryOne<User & { password_hash: string }>(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      createdAt: row.createdAt,
      isActive: row.isActive,
    };
  }

  // 根据 ID 查找用户
  async findById(id: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
  }

  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    return queryOne<User>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
  }

  // 用户登录
  async login(username: string, password: string): Promise<LoginResult | null> {
    const row = await queryOne<User & { password_hash: string }>(
      `SELECT * FROM users WHERE username = $1 AND is_active = true`,
      [username]
    );

    if (!row) {
      log.warn(`Login attempt for non-existent user: ${username}`);
      return null;
    }

    const isValid = await verifyPassword(password, row.password_hash);
    if (!isValid) {
      log.warn(`Invalid password for user: ${username}`);
      return null;
    }

    log.info(`User logged in: ${username}`);

    return {
      user: {
        id: row.id,
        username: row.username,
        email: row.email,
        createdAt: row.createdAt,
        isActive: row.isActive,
      },
      token: '', // Token 由 AuthService 生成
    };
  }

  // 更新用户
  async updateUser(id: string, data: Partial<CreateUserData>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }

    if (data.password !== undefined) {
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(await hashPassword(data.password));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return this.findById(id);
  }

  // 删除用户（软删除）
  async deleteUser(id: string): Promise<boolean> {
    await query(
      `UPDATE users SET is_active = false WHERE id = $1`,
      [id]
    );
    log.info(`User deleted: ${id}`);
    return true;
  }

  // 检查用户名是否存在
  async usernameExists(username: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) as exists`,
      [username]
    );
    return result?.exists || false;
  }

  // 检查邮箱是否存在
  async emailExists(email: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists`,
      [email]
    );
    return result?.exists || false;
  }
}

export default new UserService();
