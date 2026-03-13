import { EventEmitter } from 'events';
import { ConnectedClient } from '../types';
export declare class ConnectionManager extends EventEmitter {
    private connections;
    private userConnections;
    private deviceConnections;
    addConnection(client: ConnectedClient): void;
    removeConnection(connectionId: string): void;
    getConnection(connectionId: string): ConnectedClient | undefined;
    getUserConnections(userId: string): ConnectedClient[];
    getConnectionByDeviceId(deviceId: string): ConnectedClient | undefined;
    getAllConnections(): ConnectedClient[];
    getConnectionCount(): number;
    updateHeartbeat(connectionId: string): void;
    setAuthenticated(connectionId: string, userId: string, deviceId?: string): void;
    sendToUser(userId: string, message: any): number;
    sendToDevice(deviceId: string, message: any): boolean;
    sendToConnection(connectionId: string, message: any): void;
    getStaleConnections(timeout: number): ConnectedClient[];
    cleanExpiredConnections(timeout: number): number;
}
declare const _default: ConnectionManager;
export default _default;
//# sourceMappingURL=ConnectionManager.d.ts.map