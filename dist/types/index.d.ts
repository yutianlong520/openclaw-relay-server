export declare enum MessageType {
    AUTH_REQUEST = "auth_request",
    AUTH_RESPONSE = "auth_response",
    AUTH_LOGOUT = "auth_logout",
    CHAT_MESSAGE = "chat_message",
    CHAT_RESPONSE = "chat_response",
    CHAT_ACK = "chat_ack",
    PING = "ping",
    PONG = "pong",
    DEVICE_STATUS = "device_status",
    DEVICE_LIST = "device_list",
    DEVICE_BIND = "device_bind",
    DEVICE_UNBIND = "device_unbind",
    ERROR = "error"
}
export type ClientType = 'app' | 'claw';
export interface WSMessage {
    type: MessageType;
    payload: any;
    timestamp: number;
    messageId?: string;
}
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
export interface AuthResponse {
    success: boolean;
    userId?: string;
    deviceId?: string;
    token?: string;
    expiresAt?: number;
    error?: string;
}
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
export interface ChatAck {
    messageId: string;
    status: 'delivered' | 'read' | 'error';
    timestamp: number;
}
export interface DeviceInfo {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    platform: string;
    isOnline: boolean;
    lastSeenAt: Date;
}
export interface User {
    id: string;
    username: string;
    email?: string;
    createdAt: Date;
    isActive: boolean;
}
export interface ApiKey {
    id: string;
    keyHash: string;
    userId: string;
    name: string;
    permissions: Record<string, any>;
    expiresAt: Date;
    isActive: boolean;
}
export interface Session {
    id: string;
    token: string;
    userId: string;
    deviceId?: string;
    clientType: ClientType;
    expiresAt: Date;
    isActive: boolean;
}
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
export interface PaginationParams {
    page: number;
    pageSize: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=index.d.ts.map