import connectionManager from './ConnectionManager';
import { authService, messageService, deviceService } from '../services';
import { log } from '../utils';
import { 
  MessageType, 
  WSMessage, 
  AuthRequest, 
  AuthResponse, 
  ChatMessage,
  ChatAck 
} from '../types';

export class MessageRouter {
  // 处理 WebSocket 消息
  async handleMessage(connectionId: string, data: string): Promise<void> {
    let message: WSMessage;
    
    try {
      message = JSON.parse(data);
    } catch (error) {
      log.error('Failed to parse message', { connectionId, error });
      this.sendError(connectionId, 'INVALID_MESSAGE', 'Invalid message format');
      return;
    }

    const { type, payload, messageId } = message;

    log.debug(`Received message type: ${type}`, { connectionId, messageId });

    try {
      switch (type) {
        case MessageType.AUTH_REQUEST:
          await this.handleAuth(connectionId, payload as AuthRequest);
          break;
          
        case MessageType.CHAT_MESSAGE:
          await this.handleChatMessage(connectionId, payload as ChatMessage);
          break;
          
        case MessageType.PING:
          this.handlePing(connectionId);
          break;
          
        case MessageType.DEVICE_LIST:
          await this.handleDeviceList(connectionId);
          break;
          
        case MessageType.CHAT_ACK:
          await this.handleChatAck(connectionId, payload as ChatAck);
          break;
          
        default:
          log.warn(`Unknown message type: ${type}`, { connectionId });
          this.sendError(connectionId, 'UNKNOWN_TYPE', `Unknown message type: ${type}`);
      }
    } catch (error) {
      log.error(`Error handling message type: ${type}`, { connectionId, error });
      this.sendError(connectionId, 'INTERNAL_ERROR', 'Internal server error');
    }
  }

  // 处理认证请求
  private async handleAuth(connectionId: string, payload: AuthRequest): Promise<void> {
    const { key, deviceId, clientType } = payload;
    
    const result = await authService.authenticateWithApiKey(key, deviceId, clientType);
    
    const response: WSMessage = {
      type: MessageType.AUTH_RESPONSE,
      payload: {
        success: !!result,
        userId: result?.userId,
        deviceId,
        token: result?.token,
        expiresAt: result?.expiresAt,
        error: result ? undefined : 'Invalid API key',
      } as AuthResponse,
      timestamp: Date.now(),
    };

    connectionManager.sendToConnection(connectionId, response);

    if (result) {
      // 更新连接状态
      connectionManager.setAuthenticated(connectionId, result.userId, deviceId);
      
      // 更新设备在线状态
      if (deviceId) {
        await deviceService.updateDeviceStatus(deviceId, true);
      }
      
      log.info(`Connection authenticated: ${connectionId}, user: ${result.userId}`);
    }
  }

  // 处理聊天消息
  private async handleChatMessage(connectionId: string, payload: ChatMessage): Promise<void> {
    const client = connectionManager.getConnection(connectionId);
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
        await messageService.sendMessage(client.userId, targetDeviceId, content, type, metadata);
        
        // 发送确认
        this.sendAck(connectionId, messageId, 'delivered');
      }
    } else if (client.clientType === 'claw') {
      // Claw 发送到 App (用户)
      // 查找用户的所有 App 连接并转发
      const sent = connectionManager.sendToUser(client.userId, {
        type: MessageType.CHAT_MESSAGE,
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
  private handlePing(connectionId: string): void {
    connectionManager.updateHeartbeat(connectionId);
    
    connectionManager.sendToConnection(connectionId, {
      type: MessageType.PONG,
      payload: {},
      timestamp: Date.now(),
    });
  }

  // 处理设备列表请求
  private async handleDeviceList(connectionId: string): Promise<void> {
    const client = connectionManager.getConnection(connectionId);
    if (!client || !client.isAuthenticated) {
      this.sendError(connectionId, 'NOT_AUTHENTICATED', 'Not authenticated');
      return;
    }

    const devices = await deviceService.getUserDevices(client.userId);

    connectionManager.sendToConnection(connectionId, {
      type: MessageType.DEVICE_LIST,
      payload: { devices },
      timestamp: Date.now(),
    });
  }

  // 处理消息确认
  private async handleChatAck(connectionId: string, payload: ChatAck): Promise<void> {
    const client = connectionManager.getConnection(connectionId);
    if (!client || !client.isAuthenticated) {
      return;
    }

    const { messageId, status } = payload;

    if (status === 'delivered') {
      await messageService.markAsDelivered(messageId);
    } else if (status === 'read') {
      await messageService.markAsRead(messageId);
    }
  }

  // 发送错误消息
  private sendError(connectionId: string, code: string, message: string): void {
    connectionManager.sendToConnection(connectionId, {
      type: MessageType.ERROR,
      payload: { code, message },
      timestamp: Date.now(),
    });
  }

  // 发送确认
  private sendAck(connectionId: string, messageId: string, status: 'delivered' | 'read' | 'error'): void {
    connectionManager.sendToConnection(connectionId, {
      type: MessageType.CHAT_ACK,
      payload: {
        messageId,
        status,
        timestamp: Date.now(),
      } as ChatAck,
      timestamp: Date.now(),
    });
  }
}

export default new MessageRouter();
