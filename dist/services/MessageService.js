"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const redis_1 = require("../database/redis");
const utils_1 = require("../utils");
const types_1 = require("../types");
class MessageService {
    // 发送消息
    async sendMessage(userId, deviceId, content, type = 'text', metadata = {}) {
        const messageId = (0, uuid_1.v4)();
        const timestamp = Date.now();
        // 存储消息到数据库
        await (0, database_1.query)(`INSERT INTO messages (id, message_id, user_id, device_id, direction, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`, [(0, uuid_1.v4)(), messageId, userId, deviceId, 'inbound', content, type, JSON.stringify(metadata)]);
        // 检查设备是否在线
        const isOnline = await redis_1.deviceStore.isOnline(deviceId);
        const message = {
            messageId,
            content,
            type: type,
            timestamp,
            metadata,
        };
        if (isOnline) {
            // 设备在线，标记为已投递
            await this.markAsDelivered(messageId);
        }
        else {
            // 设备离线，存入消息队列
            const wsMessage = {
                type: types_1.MessageType.CHAT_MESSAGE,
                payload: message,
                timestamp,
                messageId,
            };
            await redis_1.messageQueue.push(`device:${deviceId}`, JSON.stringify(wsMessage));
            utils_1.log.info(`Message queued for offline device ${deviceId}`);
        }
        utils_1.log.info(`Message ${messageId} sent to device ${deviceId}, online: ${isOnline}`);
        return message;
    }
    // 标记消息为已投递
    async markAsDelivered(messageId) {
        await (0, database_1.query)(`UPDATE messages SET is_delivered = true, delivered_at = NOW() WHERE message_id = $1`, [messageId]);
    }
    // 标记消息为已读
    async markAsRead(messageId) {
        await (0, database_1.query)(`UPDATE messages SET is_read = true WHERE message_id = $1`, [messageId]);
    }
    // 获取消息历史
    async getMessageHistory(userId, deviceId, page = 1, pageSize = 20) {
        let sql = `SELECT * FROM messages WHERE user_id = $1`;
        const params = [userId];
        if (deviceId) {
            sql += ` AND device_id = $2`;
            params.push(deviceId);
        }
        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(pageSize, (page - 1) * pageSize);
        return (0, database_1.query)(sql, params);
    }
    // 获取单条消息
    async getMessage(messageId, userId) {
        return (0, database_1.queryOne)(`SELECT * FROM messages WHERE message_id = $1 AND user_id = $2`, [messageId, userId]);
    }
    // 删除消息
    async deleteMessage(messageId, userId) {
        await (0, database_1.query)(`DELETE FROM messages WHERE message_id = $1 AND user_id = $2`, [messageId, userId]);
        return true;
    }
    // 获取设备离线消息
    async getQueuedMessages(deviceId) {
        const messages = [];
        let msg;
        while ((msg = await redis_1.messageQueue.pop(`device:${deviceId}`, 0)) !== null) {
            try {
                const parsed = JSON.parse(msg);
                messages.push(parsed);
            }
            catch (error) {
                utils_1.log.error('Failed to parse queued message', error);
            }
        }
        return messages;
    }
    // 获取未读消息数
    async getUnreadCount(userId, deviceId) {
        let sql = `SELECT COUNT(*) as count FROM messages WHERE user_id = $1 AND is_read = false`;
        const params = [userId];
        if (deviceId) {
            sql += ` AND device_id = $2`;
            params.push(deviceId);
        }
        const result = await (0, database_1.queryOne)(sql, params);
        return result ? parseInt(result.count, 10) : 0;
    }
}
exports.MessageService = MessageService;
exports.default = new MessageService();
//# sourceMappingURL=MessageService.js.map