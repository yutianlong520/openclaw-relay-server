import { Pool, PoolClient } from 'pg';
import config from '../config';
import { log } from '../utils';

// PostgreSQL 连接池
let pool: Pool | null = null;

// 初始化数据库连接池
export async function initDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    log.error('Unexpected database error', err);
  });

  // 测试连接
  try {
    const client = await pool.connect();
    client.release();
    log.info('Database connection established');
  } catch (error) {
    log.error('Failed to connect to database', error);
    throw error;
  }

  return pool;
}

// 获取连接池
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

// 执行查询
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows;
}

// 执行单个查询
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

// 执行事务
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 关闭连接池
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    log.info('Database connection closed');
  }
}
