// WebSocket 消息类型
export enum MessageType {
  // 认证
  AUTH_REQUEST = 'auth_request',
  AUTH_RESPONSE = 'auth_response',
  AUTH_LOGOUT = 'auth_logout',
  
  // 聊天
  CHAT_MESSAGE = 'chat_message',
  CHAT_RESPONSE = 'chat_response',
  CHAT_ACK = 'chat_ack',
  
  // 心跳
  PING = 'ping',
  PONG = 'pong',
  
  // 设备
  DEVICE_STATUS = 'device_status',
  DEVICE_LIST = 'device_list',
  DEVICE_BIND = 'device_bind',
  DEVICE_UNBIND = 'device_unbind',
  
  // 错误
  ERROR = 'error'
}

// 客户端类型
export type ClientType = 'app' | 'claw';

// WebSocket 消息格式
export interface WSMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
  messageId?: string;
}

// 认证请求
export interface AuthRequest {
  key: string;
  deviceId?: string;
  clientType: ClientType;
  deviceInfo?: {
    name: string;
    platform: string;
    version: string;
  };
}

// 认证响应
export interface AuthResponse {
  success: boolean;
  userId?: string;
  deviceId?: string;
  token?: string;
  expiresAt?: number;
  error?: string;
}

// 聊天消息
export interface ChatMessage {
  messageId: string;
  content: string;
  type: 'text' | 'image' | 'voice';
  timestamp: number;
  metadata?: {
    encrypted?: boolean;
    nonce?: string;
    signature?: string;
    targetDeviceId?: string;
    fromDeviceId?: string;
  };
}

// 消息确认
export interface ChatAck {
  messageId: string;
  status: 'delivered' | 'read' | 'error';
  timestamp: number;
}

// 设备信息
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  platform: string;
  isOnline: boolean;
  lastSeenAt: Date;
}

// 用户信息
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: Date;
  isActive: boolean;
}

// API 密钥
export interface ApiKey {
  id: string;
  keyHash: string;
  userId: string;
  name: string;
  permissions: Record<string, any>;
  expiresAt: Date;
  isActive: boolean;
}

// 会话信息
export interface Session {
  id: string;
  token: string;
  userId: string;
  deviceId?: string;
  clientType: ClientType;
  expiresAt: Date;
  isActive: boolean;
}

// 连接的客户端
export interface ConnectedClient {
  id: string;
  userId: string;
  deviceId?: string;
  clientType: ClientType;
  socket: any;
  isAuthenticated: boolean;
  connectedAt: Date;
  lastHeartbeat: number;
  deviceInfo?: {
    name: string;
    platform: string;
    version: string;
  };
}

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
