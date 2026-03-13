import config from './config';
import { log } from './utils';
import { initDatabase, closeDatabase } from './database';
import { initRedis, closeRedis } from './database/redis';
import { webSocketServer } from './core';

// 优雅退出
async function gracefulShutdown(signal: string): Promise<void> {
  log.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    // 关闭 WebSocket 服务器
    await webSocketServer.stop();
    
    // 关闭 Redis 连接
    await closeRedis();
    
    // 关闭数据库连接
    await closeDatabase();
    
    log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', error);
    process.exit(1);
  }
}

// 启动服务器
async function main(): Promise<void> {
  log.info('='.repeat(50));
  log.info('OpenClaw Relay Server starting...');
  log.info(`Environment: ${config.nodeEnv}`);
  log.info(`Port: ${config.port}`);
  log.info('='.repeat(50));

  try {
    // 初始化数据库
    log.info('Initializing database...');
    await initDatabase();

    // 初始化 Redis
    log.info('Initializing Redis...');
    await initRedis();

    // 启动 WebSocket 服务器
    log.info('Starting WebSocket server...');
    await webSocketServer.start();

    log.info('='.repeat(50));
    log.info('OpenClaw Relay Server is running!');
    log.info(`Health check: http://${config.host}:${config.port}/health`);
    log.info('='.repeat(50));
  } catch (error) {
    log.error('Failed to start server', error);
    process.exit(1);
  }
}

// 监听退出信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的错误
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection', { reason, promise });
});

// 启动
main();
