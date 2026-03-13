"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const ConnectionManager_1 = __importDefault(require("./ConnectionManager"));
const services_1 = require("../services");
const utils_1 = require("../utils");
const types_1 = require("../types");
class MessageRouter {
    // 处理 WebSocket 消息
    async handleMessage(connectionId, data) {
        let message;
        try {
            message = JSON.parse(data);
        }
        catch (error) {
            utils_1.log.error('Failed to parse message', { connectionId, error });
            this.sendError(connectionId, 'INVALID_MESSAGE', 'Invalid message format');
            return;
        }
        const { type, payload, messageId } = message;
        utils_1.log.debug(`Received message type: ${type}`, { connectionId, messageId });
        try {
            switch (type) {
                case types_1.MessageType.AUTH_REQUEST:
                    await this.handleAuth(connectionId, payload);
                    break;
                case types_1.MessageType.CHAT_MESSAGE:
                    await this.handleChatMessage(connectionId, payload);
                    break;
                case types_1.MessageType.PING:
                    this.handlePing(connectionId);
                    break;
                case types_1.MessageType.DEVICE_LIST:
                    await this.handleDeviceList(connectionId);
                    break;
                case types_1.MessageType.CHAT_ACK:
                    await this.handleChatAck(connectionId, payload);
                    break;
                default:
                    utils_1.log.warn(`Unknown message type: ${type}`, { connectionId });
                    this.sendError(connectionId, 'UNKNOWN_TYPE', `Unknown message type: ${type}`);
            }
        }
        catch (error) {
            utils_1.log.error(`Error handling message type: ${type}`, { connectionId, error });
            this.sendError(connectionId, 'INTERNAL_ERROR', 'Internal server error');
        }
    }
    // 处理认证请求
    async handleAuth(connectionId, payload) {
        const { key, deviceId, clientType } = payload;
        const result = await services_1.authService.authenticateWithApiKey(key, deviceId, clientType);
        const response = {
            type: types_1.MessageType.AUTH_RESPONSE,
            payload: {
                success: !!result,
                userId: result?.userId,
                deviceId,
                token: result?.token,
                expiresAt: result?.expiresAt,
                error: result ? undefined : 'Invalid API key',
            },
            timestamp: Date.now(),
        };
        ConnectionManager_1.default.sendToConnection(connectionId, response);
        if (result) {
            // 更新连接状态
            ConnectionManager_1.default.setAuthenticated(connectionId, result.userId, deviceId);
            // 更新设备在线状态
            if (deviceId) {
                await services_1.deviceService.updateDeviceStatus(deviceId, true);
            }
            utils_1.log.info(`Connection authenticated: ${connectionId}, user: ${result.userId}`);
        }
    }
    // 处理聊天消息
    async handleChatMessage(connectionId, payload) {
        const client = ConnectionManager_1.default.getConnection(connectionId);
        if (!client || !client.isAuthenticated) {
            this.sendError(connectionId, 'NOT_AUTHENTICATED', 'Not authenticated');
            return;
        }
        const { messageId, content, type, metadata } = payload;
        // 发送消息到目标设备
        if (client.clientType === 'app') {
            // App 发送到本地 Claw
            const targetDeviceId = metadata?.targetDeviceId;
            if (targetDeviceId) {
                await services_1.messageService.sendMessage(client.userId, targetDeviceId, content, type, metadata);
                // 发送确认
                this.sendAck(connectionId, messageId, 'delivered');
            }
        }
        else if (client.clientType === 'claw') {
            // Claw 发送到 App (用户)
            // 查找用户的所有 App 连接并转发
            const sent = ConnectionManager_1.default.sendToUser(client.userId, {
                type: types_1.MessageType.CHAT_MESSAGE,
                payload: {
                    messageId,
                    content,
                    type,
                    timestamp: payload.timestamp,
                    metadata,
                    fromDeviceId: client.deviceId,
                },
                timestamp: Date.now(),
            });
            if (sent > 0) {
                this.sendAck(connectionId, messageId, 'delivered');
            }
        }
    }
    // 处理心跳
    handlePing(connectionId) {
        ConnectionManager_1.default.updateHeartbeat(connectionId);
        ConnectionManager_1.default.sendToConnection(connectionId, {
            type: types_1.MessageType.PONG,
            payload: {},
            timestamp: Date.now(),
        });
    }
    // 处理设备列表请求
    async handleDeviceList(connectionId) {
        const client = ConnectionManager_1.default.getConnection(connectionId);
        if (!client || !client.isAuthenticated) {
            this.sendError(connectionId, 'NOT_AUTHENTICATED', 'Not authenticated');
            return;
        }
        const devices = await services_1.deviceService.getUserDevices(client.userId);
        ConnectionManager_1.default.sendToConnection(connectionId, {
            type: types_1.MessageType.DEVICE_LIST,
            payload: { devices },
            timestamp: Date.now(),
        });
    }
    // 处理消息确认
    async handleChatAck(connectionId, payload) {
        const client = ConnectionManager_1.default.getConnection(connectionId);
        if (!client || !client.isAuthenticated) {
            return;
        }
        const { messageId, status } = payload;
        if (status === 'delivered') {
            await services_1.messageService.markAsDelivered(messageId);
        }
        else if (status === 'read') {
            await services_1.messageService.markAsRead(messageId);
        }
    }
    // 发送错误消息
    sendError(connectionId, code, message) {
        ConnectionManager_1.default.sendToConnection(connectionId, {
            type: types_1.MessageType.ERROR,
            payload: { code, message },
            timestamp: Date.now(),
        });
    }
    // 发送确认
    sendAck(connectionId, messageId, status) {
        ConnectionManager_1.default.sendToConnection(connectionId, {
            type: types_1.MessageType.CHAT_ACK,
            payload: {
                messageId,
                status,
                timestamp: Date.now(),
            },
            timestamp: Date.now(),
        });
    }
}
exports.MessageRouter = MessageRouter;
exports.default = new MessageRouter();
//# sourceMappingURL=MessageRouter.js.map