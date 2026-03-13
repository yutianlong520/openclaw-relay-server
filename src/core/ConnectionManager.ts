import { EventEmitter } from 'events';
import { ConnectedClient } from '../types';
import { log } from '../utils';

export class ConnectionManager extends EventEmitter {
  private connections: Map<string, ConnectedClient> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<connectionId>
  private deviceConnections: Map<string, string> = new Map(); // deviceId -> connectionId

  // 添加连接
  addConnection(client: ConnectedClient): void {
    this.connections.set(client.id, client);
    
    // 按用户分组
    if (!this.userConnections.has(client.userId)) {
      this.userConnections.set(client.userId, new Set());
    }
    this.userConnections.get(client.userId)!.add(client.id);
    
    // 按设备分组
    if (client.deviceId) {
      this.deviceConnections.set(client.deviceId, client.id);
    }

    log.info(`Connection added: ${client.id}, user: ${client.userId}, device: ${client.deviceId}, type: ${client.clientType}`);
    
    this.emit('connection:add', client);
  }

  // 移除连接
  removeConnection(connectionId: string): void {
    const client = this.connections.get(connectionId);
    if (!client) return;

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
    
    log.info(`Connection removed: ${connectionId}, user: ${client.userId}`);
    
    this.emit('connection:remove', client);
  }

  // 获取连接
  getConnection(connectionId: string): ConnectedClient | undefined {
    return this.connections.get(connectionId);
  }

  // 获取用户的连接
  getUserConnections(userId: string): ConnectedClient[] {
    const connIds = this.userConnections.get(userId);
    if (!connIds) return [];
    
    return Array.from(connIds)
      .map(id => this.connections.get(id))
      .filter((c): c is ConnectedClient => c !== undefined);
  }

  // 通过设备ID获取连接
  getConnectionByDeviceId(deviceId: string): ConnectedClient | undefined {
    const connId = this.deviceConnections.get(deviceId);
    if (!connId) return undefined;
    return this.connections.get(connId);
  }

  // 获取所有连接
  getAllConnections(): ConnectedClient[] {
    return Array.from(this.connections.values());
  }

  // 获取连接数
  getConnectionCount(): number {
    return this.connections.size;
  }

  // 更新连接的心跳时间
  updateHeartbeat(connectionId: string): void {
    const client = this.connections.get(connectionId);
    if (client) {
      client.lastHeartbeat = Date.now();
    }
  }

  // 设置连接已认证
  setAuthenticated(connectionId: string, userId: string, deviceId?: string): void {
    const client = this.connections.get(connectionId);
    if (client) {
      client.userId = userId;
      client.deviceId = deviceId;
      client.isAuthenticated = true;
      
      // 重新添加到用户分组
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
      
      // 重新添加到设备分组
      if (deviceId) {
        this.deviceConnections.set(deviceId, connectionId);
      }
    }
  }

  // 发送消息给用户的所有连接
  sendToUser(userId: string, message: any): number {
    const connections = this.getUserConnections(userId);
    let sentCount = 0;
    
    for (const conn of connections) {
      try {
        this.sendToConnection(conn.id, message);
        sentCount++;
      } catch (error) {
        log.error(`Failed to send message to connection ${conn.id}`, error);
      }
    }
    
    return sentCount;
  }

  // 发送消息给设备
  sendToDevice(deviceId: string, message: any): boolean {
    const conn = this.getConnectionByDeviceId(deviceId);
    if (!conn) return false;
    
    try {
      this.sendToConnection(conn.id, message);
      return true;
    } catch (error) {
      log.error(`Failed to send message to device ${deviceId}`, error);
      return false;
    }
  }

  // 发送消息给指定连接
  sendToConnection(connectionId: string, message: any): void {
    const client = this.connections.get(connectionId);
    if (!client || !client.socket) return;
    
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    client.socket.send(data);
  }

  // 获取需要心跳检测的连接
  getStaleConnections(timeout: number): ConnectedClient[] {
    const now = Date.now();
    return Array.from(this.connections.values()).filter(
      client => now - client.lastHeartbeat > timeout
    );
  }

  // 清理过期连接
  cleanExpiredConnections(timeout: number): number {
    const stale = this.getStaleConnections(timeout);
    let cleaned = 0;
    
    for (const client of stale) {
      try {
        if (client.socket && client.socket.close) {
          client.socket.close();
        }
      } catch (error) {
        log.error(`Error closing stale connection ${client.id}`, error);
      }
      this.removeConnection(client.id);
      cleaned++;
    }
    
    if (cleaned > 0) {
      log.info(`Cleaned ${cleaned} expired connections`);
    }
    
    return cleaned;
  }
}

export default new ConnectionManager();
