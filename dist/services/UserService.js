"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const crypto_1 = require("../utils/crypto");
const utils_1 = require("../utils");
class UserService {
    // 创建用户
    async createUser(data) {
        const id = (0, uuid_1.v4)();
        const passwordHash = await (0, crypto_1.hashPassword)(data.password);
        await (0, database_1.query)(`INSERT INTO users (id, username, email, password_hash, created_at, is_active)
       VALUES ($1, $2, $3, $4, NOW(), true)`, [id, data.username, data.email || null, passwordHash]);
        utils_1.log.info(`User created: ${data.username}`);
        return {
            id,
            username: data.username,
            email: data.email,
            createdAt: new Date(),
            isActive: true,
        };
    }
    // 根据用户名查找用户
    async findByUsername(username) {
        const row = await (0, database_1.queryOne)(`SELECT * FROM users WHERE username = $1`, [username]);
        if (!row)
            return null;
        return {
            id: row.id,
            username: row.username,
            email: row.email,
            createdAt: row.createdAt,
            isActive: row.isActive,
        };
    }
    // 根据 ID 查找用户
    async findById(id) {
        return (0, database_1.queryOne)(`SELECT * FROM users WHERE id = $1`, [id]);
    }
    // 根据邮箱查找用户
    async findByEmail(email) {
        return (0, database_1.queryOne)(`SELECT * FROM users WHERE email = $1`, [email]);
    }
    // 用户登录
    async login(username, password) {
        const row = await (0, database_1.queryOne)(`SELECT * FROM users WHERE username = $1 AND is_active = true`, [username]);
        if (!row) {
            utils_1.log.warn(`Login attempt for non-existent user: ${username}`);
            return null;
        }
        const isValid = await (0, crypto_1.verifyPassword)(password, row.password_hash);
        if (!isValid) {
            utils_1.log.warn(`Invalid password for user: ${username}`);
            return null;
        }
        utils_1.log.info(`User logged in: ${username}`);
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
    async updateUser(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(data.email);
        }
        if (data.password !== undefined) {
            updates.push(`password_hash = $${paramIndex++}`);
            values.push(await (0, crypto_1.hashPassword)(data.password));
        }
        if (updates.length === 0) {
            return this.findById(id);
        }
        updates.push(`updated_at = NOW()`);
        values.push(id);
        await (0, database_1.query)(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
        return this.findById(id);
    }
    // 删除用户（软删除）
    async deleteUser(id) {
        await (0, database_1.query)(`UPDATE users SET is_active = false WHERE id = $1`, [id]);
        utils_1.log.info(`User deleted: ${id}`);
        return true;
    }
    // 检查用户名是否存在
    async usernameExists(username) {
        const result = await (0, database_1.queryOne)(`SELECT EXISTS(SELECT 1 FROM users WHERE username = $1) as exists`, [username]);
        return result?.exists || false;
    }
    // 检查邮箱是否存在
    async emailExists(email) {
        const result = await (0, database_1.queryOne)(`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists`, [email]);
        return result?.exists || false;
    }
}
exports.UserService = UserService;
exports.default = new UserService();
//# sourceMappingURL=UserService.js.map