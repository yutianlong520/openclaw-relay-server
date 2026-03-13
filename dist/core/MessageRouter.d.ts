export declare class MessageRouter {
    handleMessage(connectionId: string, data: string): Promise<void>;
    private handleAuth;
    private handleChatMessage;
    private handlePing;
    private handleDeviceList;
    private handleChatAck;
    private sendError;
    private sendAck;
}
declare const _default: MessageRouter;
export default _default;
//# sourceMappingURL=MessageRouter.d.ts.map