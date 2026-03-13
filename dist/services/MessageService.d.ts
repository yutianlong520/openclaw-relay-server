import { ChatMessage, WSMessage } from '../types';
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
export declare class MessageService {
    sendMessage(userId: string, deviceId: string, content: string, type?: string, metadata?: Record<string, any>): Promise<ChatMessage>;
    markAsDelivered(messageId: string): Promise<void>;
    markAsRead(messageId: string): Promise<void>;
    getMessageHistory(userId: string, deviceId?: string, page?: number, pageSize?: number): Promise<StoredMessage[]>;
    getMessage(messageId: string, userId: string): Promise<StoredMessage | null>;
    deleteMessage(messageId: string, userId: string): Promise<boolean>;
    getQueuedMessages(deviceId: string): Promise<WSMessage[]>;
    getUnreadCount(userId: string, deviceId?: string): Promise<number>;
}
declare const _default: MessageService;
export default _default;
//# sourceMappingURL=MessageService.d.ts.map