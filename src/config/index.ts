import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export interface AppConfig {
  // 服务器
  port: number;
  host: string;
  nodeEnv: string;
  
  // 数据库
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  
  // Redis
  redis: {
    host: string;
    port: number;
    password: string;
  };
  
  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
  };
  
  // API
  api: {
    keyExpiresDays: number;
  };
  
  // 日志
  logging: {
    level: string;
    file: string;
  };
  
  // WebSocket
  websocket: {
    heartbeatInterval: number;
    heartbeatTimeout: number;
    maxPayloadSize: number;
  };
}

const config: AppConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'openclaw',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  api: {
    keyExpiresDays: parseInt(process.env.API_KEY_EXPIRES_DAYS || '90', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  websocket: {
    heartbeatInterval: 30000, // 30秒心跳间隔
    heartbeatTimeout: 60000,  // 60秒超时
    maxPayloadSize: 16 * 1024 * 1024, // 16MB
  },
};

export default config;
