import { WebSocket, WebSocketServer as WSServer } from 'ws';
import { createServer, Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import connectionManager from './ConnectionManager';
import messageRouter from './MessageRouter';
import { deviceService } from '../services';
import { log } from '../utils';
import { ConnectedClient, ClientType } from '../types';

export class WebSocketServer {
  private server: Server | null = null;
  private wss: WSServer | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // 启动服务器
  async start(): Promise<void> {
    // 创建 HTTP 服务器
    this.server = createServer((req, res) => {
      // 简单的健康检查端点
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', connections: connectionManager.getConnectionCount() }));
        return;
      }
      
      // 根路径返回服务信息
      if (req.url === '/' || req.url === '') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          name: 'OpenClaw Relay Server',
          version: '1.0.0',
          status: 'running',
          connections: connectionManager.getConnectionCount()
        }));
        return;
      }
      
      res.writeHead(404);
      res.end('Not Found');
    });

    // 创建 WebSocket 服务器
    this.wss = new WSServer({
      server: this.server,
      maxPayload: config.websocket.maxPayloadSize,
      clientTracking: false, // 我们自己管理连接
    });

    // 处理连接
    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    // 处理错误
    this.wss.on('error', (error) => {
      log.error('WebSocket server error', error);
    });

    // 启动心跳检测
    this.startHeartbeat();

    // 启动服务器
    return new Promise((resolve, reject) => {
      this.server!.listen(config.port, config.host, () => {
        log.info(`WebSocket server listening on ${config.host}:${config.port}`);
        resolve();
      });

      this.server!.on('error', (error) => {
        log.error('Server error', error);
        reject(error);
      });
    });
  }

  // 处理新连接
  private handleConnection(ws: WebSocket, req: any): void {
    const connectionId = uuidv4();
    const clientIp = req.socket.remoteAddress;
    
    log.info(`New connection: ${connectionId} from ${clientIp}`);

    // 创建客户端对象
    const client: ConnectedClient = {
      id: connectionId,
      userId: '', // 等待认证
      clientType: 'app' as ClientType, // 默认
      socket: ws,
      isAuthenticated: false,
      connectedAt: new Date(),
      lastHeartbeat: Date.now(),
    };

    // 添加到连接管理器
    connectionManager.addConnection(client);

    // 处理消息
    ws.on('message', (data: Buffer) => {
      try {
        const message = data.toString();
        messageRouter.handleMessage(connectionId, message);
      } catch (error) {
        log.error('Error processing message', { connectionId, error });
      }
    });

    // 处理关闭
    ws.on('close', async () => {
      log.info(`Connection closed: ${connectionId}`);
      
      // 获取客户端信息以便更新设备状态
      const client = connectionManager.getConnection(connectionId);
      if (client && client.deviceId) {
        await deviceService.updateDeviceStatus(client.deviceId, false);
      }
      
      connectionManager.removeConnection(connectionId);
    });

    // 处理错误
    ws.on('error', (error) => {
      log.error(`Connection error: ${connectionId}`, error);
      connectionManager.removeConnection(connectionId);
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
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      // 清理过期连接
      connectionManager.cleanExpiredConnections(config.websocket.heartbeatTimeout);
    }, config.websocket.heartbeatInterval);

    log.info('Heartbeat started', { 
      interval: config.websocket.heartbeatInterval,
      timeout: config.websocket.heartbeatTimeout 
    });
  }

  // 停止服务器
  async stop(): Promise<void> {
    // 停止心跳
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // 关闭所有连接
    const connections = connectionManager.getAllConnections();
    for (const client of connections) {
      try {
        client.socket.close();
      } catch (error) {
        log.error('Error closing connection', { connectionId: client.id, error });
      }
    }

    // 关闭 WebSocket 服务器
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => {
          log.info('WebSocket server closed');
          resolve();
        });
      });
    }

    // 关闭 HTTP 服务器
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => {
          log.info('HTTP server closed');
          resolve();
        });
      });
    }
  }

  // 获取服务器状态
  getStatus(): { running: boolean; connections: number } {
    return {
      running: this.wss !== null,
      connections: connectionManager.getConnectionCount(),
    };
  }
}

export default new WebSocketServer();
