"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const ws_1 = require("ws");
const http_1 = require("http");
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const ConnectionManager_1 = __importDefault(require("./ConnectionManager"));
const MessageRouter_1 = __importDefault(require("./MessageRouter"));
const services_1 = require("../services");
const utils_1 = require("../utils");
class WebSocketServer {
    constructor() {
        this.server = null;
        this.wss = null;
        this.heartbeatInterval = null;
    }
    // 启动服务器
    async start() {
        // 创建 HTTP 服务器
        this.server = (0, http_1.createServer)((req, res) => {
            // 简单的健康检查端点
            if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', connections: ConnectionManager_1.default.getConnectionCount() }));
                return;
            }
            // 根路径返回服务信息
            if (req.url === '/' || req.url === '') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    name: 'OpenClaw Relay Server',
                    version: '1.0.0',
                    status: 'running',
                    connections: ConnectionManager_1.default.getConnectionCount()
                }));
                return;
            }
            res.writeHead(404);
            res.end('Not Found');
        });
        // 创建 WebSocket 服务器
        this.wss = new ws_1.WebSocketServer({
            server: this.server,
            maxPayload: config_1.default.websocket.maxPayloadSize,
            clientTracking: false, // 我们自己管理连接
        });
        // 处理连接
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
        // 处理错误
        this.wss.on('error', (error) => {
            utils_1.log.error('WebSocket server error', error);
        });
        // 启动心跳检测
        this.startHeartbeat();
        // 启动服务器
        return new Promise((resolve, reject) => {
            this.server.listen(config_1.default.port, config_1.default.host, () => {
                utils_1.log.info(`WebSocket server listening on ${config_1.default.host}:${config_1.default.port}`);
                resolve();
            });
            this.server.on('error', (error) => {
                utils_1.log.error('Server error', error);
                reject(error);
            });
        });
    }
    // 处理新连接
    handleConnection(ws, req) {
        const connectionId = (0, uuid_1.v4)();
        const clientIp = req.socket.remoteAddress;
        utils_1.log.info(`New connection: ${connectionId} from ${clientIp}`);
        // 创建客户端对象
        const client = {
            id: connectionId,
            userId: '', // 等待认证
            clientType: 'app', // 默认
            socket: ws,
            isAuthenticated: false,
            connectedAt: new Date(),
            lastHeartbeat: Date.now(),
        };
        // 添加到连接管理器
        ConnectionManager_1.default.addConnection(client);
        // 处理消息
        ws.on('message', (data) => {
            try {
                const message = data.toString();
                MessageRouter_1.default.handleMessage(connectionId, message);
            }
            catch (error) {
                utils_1.log.error('Error processing message', { connectionId, error });
            }
        });
        // 处理关闭
        ws.on('close', async () => {
            utils_1.log.info(`Connection closed: ${connectionId}`);
            // 获取客户端信息以便更新设备状态
            const client = ConnectionManager_1.default.getConnection(connectionId);
            if (client && client.deviceId) {
                await services_1.deviceService.updateDeviceStatus(client.deviceId, false);
            }
            ConnectionManager_1.default.removeConnection(connectionId);
        });
        // 处理错误
        ws.on('error', (error) => {
            utils_1.log.error(`Connection error: ${connectionId}`, error);
            ConnectionManager_1.default.removeConnection(connectionId);
        });
        // 发送欢迎消息
        ws.send(JSON.stringify({
            type: 'welcome',
            payload: {
                message: 'Welcome to OpenClaw Relay Server',
                connectionId,
            },
            timestamp: Date.now(),
        }));
    }
    // 启动心跳检测
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            // 清理过期连接
            ConnectionManager_1.default.cleanExpiredConnections(config_1.default.websocket.heartbeatTimeout);
        }, config_1.default.websocket.heartbeatInterval);
        utils_1.log.info('Heartbeat started', {
            interval: config_1.default.websocket.heartbeatInterval,
            timeout: config_1.default.websocket.heartbeatTimeout
        });
    }
    // 停止服务器
    async stop() {
        // 停止心跳
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        // 关闭所有连接
        const connections = ConnectionManager_1.default.getAllConnections();
        for (const client of connections) {
            try {
                client.socket.close();
            }
            catch (error) {
                utils_1.log.error('Error closing connection', { connectionId: client.id, error });
            }
        }
        // 关闭 WebSocket 服务器
        if (this.wss) {
            await new Promise((resolve) => {
                this.wss.close(() => {
                    utils_1.log.info('WebSocket server closed');
                    resolve();
                });
            });
        }
        // 关闭 HTTP 服务器
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => {
                    utils_1.log.info('HTTP server closed');
                    resolve();
                });
            });
        }
    }
    // 获取服务器状态
    getStatus() {
        return {
            running: this.wss !== null,
            connections: ConnectionManager_1.default.getConnectionCount(),
        };
    }
}
exports.WebSocketServer = WebSocketServer;
exports.default = new WebSocketServer();
//# sourceMappingURL=WebSocketServer.js.map