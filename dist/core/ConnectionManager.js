"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const events_1 = require("events");
const utils_1 = require("../utils");
class ConnectionManager extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.connections = new Map();
        this.userConnections = new Map(); // userId -> Set<connectionId>
        this.deviceConnections = new Map(); // deviceId -> connectionId
    }
    // 添加连接
    addConnection(client) {
        this.connections.set(client.id, client);
        // 按用户分组
        if (!this.userConnections.has(client.userId)) {
            this.userConnections.set(client.userId, new Set());
        }
        this.userConnections.get(client.userId).add(client.id);
        // 按设备分组
        if (client.deviceId) {
            this.deviceConnections.set(client.deviceId, client.id);
        }
        utils_1.log.info(`Connection added: ${client.id}, user: ${client.userId}, device: ${client.deviceId}, type: ${client.clientType}`);
        this.emit('connection:add', client);
    }
    // 移除连接
    removeConnection(connectionId) {
        const client = this.connections.get(connectionId);
        if (!client)
            return;
        // 从用户分组中移除
        const userConns = this.userConnections.get(client.userId);
        if (userConns) {
            userConns.delete(connectionId);
            if (userConns.size === 0) {
                this.userConnections.delete(client.userId);
            }
        }
        // 从设备分组中移除
        if (client.deviceId) {
            this.deviceConnections.delete(client.deviceId);
        }
        this.connections.delete(connectionId);
        utils_1.log.info(`Connection removed: ${connectionId}, user: ${client.userId}`);
        this.emit('connection:remove', client);
    }
    // 获取连接
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }
    // 获取用户的连接
    getUserConnections(userId) {
        const connIds = this.userConnections.get(userId);
        if (!connIds)
            return [];
        return Array.from(connIds)
            .map(id => this.connections.get(id))
            .filter((c) => c !== undefined);
    }
    // 通过设备ID获取连接
    getConnectionByDeviceId(deviceId) {
        const connId = this.deviceConnections.get(deviceId);
        if (!connId)
            return undefined;
        return this.connections.get(connId);
    }
    // 获取所有连接
    getAllConnections() {
        return Array.from(this.connections.values());
    }
    // 获取连接数
    getConnectionCount() {
        return this.connections.size;
    }
    // 更新连接的心跳时间
    updateHeartbeat(connectionId) {
        const client = this.connections.get(connectionId);
        if (client) {
            client.lastHeartbeat = Date.now();
        }
    }
    // 设置连接已认证
    setAuthenticated(connectionId, userId, deviceId) {
        const client = this.connections.get(connectionId);
        if (client) {
            client.userId = userId;
            client.deviceId = deviceId;
            client.isAuthenticated = true;
            // 重新添加到用户分组
            if (!this.userConnections.has(userId)) {
                this.userConnections.set(userId, new Set());
            }
            this.userConnections.get(userId).add(connectionId);
            // 重新添加到设备分组
            if (deviceId) {
                this.deviceConnections.set(deviceId, connectionId);
            }
        }
    }
    // 发送消息给用户的所有连接
    sendToUser(userId, message) {
        const connections = this.getUserConnections(userId);
        let sentCount = 0;
        for (const conn of connections) {
            try {
                this.sendToConnection(conn.id, message);
                sentCount++;
            }
            catch (error) {
                utils_1.log.error(`Failed to send message to connection ${conn.id}`, error);
            }
        }
        return sentCount;
    }
    // 发送消息给设备
    sendToDevice(deviceId, message) {
        const conn = this.getConnectionByDeviceId(deviceId);
        if (!conn)
            return false;
        try {
            this.sendToConnection(conn.id, message);
            return true;
        }
        catch (error) {
            utils_1.log.error(`Failed to send message to device ${deviceId}`, error);
            return false;
        }
    }
    // 发送消息给指定连接
    sendToConnection(connectionId, message) {
        const client = this.connections.get(connectionId);
        if (!client || !client.socket)
            return;
        const data = typeof message === 'string' ? message : JSON.stringify(message);
        client.socket.send(data);
    }
    // 获取需要心跳检测的连接
    getStaleConnections(timeout) {
        const now = Date.now();
        return Array.from(this.connections.values()).filter(client => now - client.lastHeartbeat > timeout);
    }
    // 清理过期连接
    cleanExpiredConnections(timeout) {
        const stale = this.getStaleConnections(timeout);
        let cleaned = 0;
        for (const client of stale) {
            try {
                if (client.socket && client.socket.close) {
                    client.socket.close();
                }
            }
            catch (error) {
                utils_1.log.error(`Error closing stale connection ${client.id}`, error);
            }
            this.removeConnection(client.id);
            cleaned++;
        }
        if (cleaned > 0) {
            utils_1.log.info(`Cleaned ${cleaned} expired connections`);
        }
        return cleaned;
    }
}
exports.ConnectionManager = ConnectionManager;
exports.default = new ConnectionManager();
//# sourceMappingURL=ConnectionManager.js.map