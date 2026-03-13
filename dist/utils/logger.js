"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
// 确保日志目录存在
const logDir = path_1.default.dirname(config_1.default.logging.file);
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// 日志格式
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
}));
// 创建 logger 实例
const logger = winston_1.default.createLogger({
    level: config_1.default.logging.level,
    format: logFormat,
    transports: [
        // 控制台输出
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat),
        }),
        // 文件输出
        new winston_1.default.transports.File({
            filename: config_1.default.logging.file,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
    ],
});
exports.default = logger;
// 便捷方法
exports.log = {
    info: (message, ...meta) => logger.info(message, ...meta),
    warn: (message, ...meta) => logger.warn(message, ...meta),
    error: (message, ...meta) => logger.error(message, ...meta),
    debug: (message, ...meta) => logger.debug(message, ...meta),
};
//# sourceMappingURL=logger.js.map