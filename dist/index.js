"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./config"));
const utils_1 = require("./utils");
const database_1 = require("./database");
const redis_1 = require("./database/redis");
const core_1 = require("./core");
// 优雅退出
async function gracefulShutdown(signal) {
    utils_1.log.info(`Received ${signal}, starting graceful shutdown...`);
    try {
        // 关闭 WebSocket 服务器
        await core_1.webSocketServer.stop();
        // 关闭 Redis 连接
        await (0, redis_1.closeRedis)();
        // 关闭数据库连接
        await (0, database_1.closeDatabase)();
        utils_1.log.info('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        utils_1.log.error('Error during shutdown', error);
        process.exit(1);
    }
}
// 启动服务器
async function main() {
    utils_1.log.info('='.repeat(50));
    utils_1.log.info('OpenClaw Relay Server starting...');
    utils_1.log.info(`Environment: ${config_1.default.nodeEnv}`);
    utils_1.log.info(`Port: ${config_1.default.port}`);
    utils_1.log.info('='.repeat(50));
    try {
        // 初始化数据库
        utils_1.log.info('Initializing database...');
        await (0, database_1.initDatabase)();
        // 初始化 Redis
        utils_1.log.info('Initializing Redis...');
        await (0, redis_1.initRedis)();
        // 启动 WebSocket 服务器
        utils_1.log.info('Starting WebSocket server...');
        await core_1.webSocketServer.start();
        utils_1.log.info('='.repeat(50));
        utils_1.log.info('OpenClaw Relay Server is running!');
        utils_1.log.info(`Health check: http://${config_1.default.host}:${config_1.default.port}/health`);
        utils_1.log.info('='.repeat(50));
    }
    catch (error) {
        utils_1.log.error('Failed to start server', error);
        process.exit(1);
    }
}
// 监听退出信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// 处理未捕获的错误
process.on('uncaughtException', (error) => {
    utils_1.log.error('Uncaught exception', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    utils_1.log.error('Unhandled rejection', { reason, promise });
});
// 启动
main();
//# sourceMappingURL=index.js.map