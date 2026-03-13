export declare class WebSocketServer {
    private server;
    private wss;
    private heartbeatInterval;
    start(): Promise<void>;
    private handleConnection;
    private startHeartbeat;
    stop(): Promise<void>;
    getStatus(): {
        running: boolean;
        connections: number;
    };
}
declare const _default: WebSocketServer;
export default _default;
//# sourceMappingURL=WebSocketServer.d.ts.map