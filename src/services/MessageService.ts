import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../database';
import { messageQueue, deviceStore } from '../database/redis';
import { log } from '../utils';
import { ChatMessage, MessageType, WSMessage } from '../types';

// 消息存储
export interface StoredMessage {
  id: string;
  message_id: string;
  user_id: string;
  device_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: string;
  metadata: Record<string, any>;
  is_delivered: boolean;
  is_read: boolean;
  created_at: Date;
  delivered_at: Date | null;
}

export class MessageService {
  // 发送消息
  async sendMessage(
    userId: string,
    deviceId: string,
    content: string,
    type: string = 'text',
    metadata: Record<string, any> = {}
  ): Promise<ChatMessage> {
    const messageId = uuidv4();
    const timestamp = Date.now();

    // 存储消息到数据库
    await query(
      `INSERT INTO messages (id, message_id, user_id, device_id, direction, content, message_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [uuidv4(), messageId, userId, deviceId, 'inbound', content, type, JSON.stringify(metadata)]
    );

    // 检查设备是否在线
    const isOnline = await deviceStore.isOnline(deviceId);

    const message: ChatMessage = {
      messageId,
      content,
      type: type as 'text' | 'image' | 'voice',
      timestamp,
      metadata,
    };

    if (isOnline) {
      // 设备在线，标记为已投递
      await this.markAsDelivered(messageId);
    } else {
      // 设备离线，存入消息队列
      const wsMessage: WSMessage = {
        type: MessageType.CHAT_MESSAGE,
        payload: message,
        timestamp,
        messageId,
      };
      await messageQueue.push(`device:${deviceId}`, JSON.stringify(wsMessage));
      log.info(`Message queued for offline device ${deviceId}`);
    }

    log.info(`Message ${messageId} sent to device ${deviceId}, online: ${isOnline}`);
    return message;
  }

  // 标记消息为已投递
  async markAsDelivered(messageId: string): Promise<void> {
    await query(
      `UPDATE messages SET is_delivered = true, delivered_at = NOW() WHERE message_id = $1`,
      [messageId]
    );
  }

  // 标记消息为已读
  async markAsRead(messageId: string): Promise<void> {
    await query(
      `UPDATE messages SET is_read = true WHERE message_id = $1`,
      [messageId]
    );
  }

  // 获取消息历史
  async getMessageHistory(
    userId: string,
    deviceId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<StoredMessage[]> {
    let sql = `SELECT * FROM messages WHERE user_id = $1`;
    const params: any[] = [userId];

    if (deviceId) {
      sql += ` AND device_id = $2`;
      params.push(deviceId);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, (page - 1) * pageSize);

    return query<StoredMessage>(sql, params);
  }

  // 获取单条消息
  async getMessage(messageId: string, userId: string): Promise<StoredMessage | null> {
    return queryOne<StoredMessage>(
      `SELECT * FROM messages WHERE message_id = $1 AND user_id = $2`,
      [messageId, userId]
    );
  }

  // 删除消息
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    await query(
      `DELETE FROM messages WHERE message_id = $1 AND user_id = $2`,
      [messageId, userId]
    );
    return true;
  }

  // 获取设备离线消息
  async getQueuedMessages(deviceId: string): Promise<WSMessage[]> {
    const messages: WSMessage[] = [];
    let msg: string | null;

    while ((msg = await messageQueue.pop(`device:${deviceId}`, 0)) !== null) {
      try {
        const parsed = JSON.parse(msg) as WSMessage;
        messages.push(parsed);
      } catch (error) {
        log.error('Failed to parse queued message', error);
      }
    }

    return messages;
  }

  // 获取未读消息数
  async getUnreadCount(userId: string, deviceId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM messages WHERE user_id = $1 AND is_read = false`;
    const params: any[] = [userId];

    if (deviceId) {
      sql += ` AND device_id = $2`;
      params.push(deviceId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new MessageService();
