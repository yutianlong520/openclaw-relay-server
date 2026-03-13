"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
exports.getPool = getPool;
exports.query = query;
exports.queryOne = queryOne;
exports.transaction = transaction;
exports.closeDatabase = closeDatabase;
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
const utils_1 = require("../utils");
// PostgreSQL 连接池
let pool = null;
// 初始化数据库连接池
async function initDatabase() {
    if (pool) {
        return pool;
    }
    pool = new pg_1.Pool({
        host: config_1.default.database.host,
        port: config_1.default.database.port,
        database: config_1.default.database.name,
        user: config_1.default.database.user,
        password: config_1.default.database.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
    pool.on('error', (err) => {
        utils_1.log.error('Unexpected database error', err);
    });
    // 测试连接
    try {
        const client = await pool.connect();
        client.release();
        utils_1.log.info('Database connection established');
    }
    catch (error) {
        utils_1.log.error('Failed to connect to database', error);
        throw error;
    }
    return pool;
}
// 获取连接池
function getPool() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return pool;
}
// 执行查询
async function query(text, params) {
    const result = await getPool().query(text, params);
    return result.rows;
}
// 执行单个查询
async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows[0] || null;
}
// 执行事务
async function transaction(callback) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
// 关闭连接池
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        utils_1.log.info('Database connection closed');
    }
}
//# sourceMappingURL=index.js.map