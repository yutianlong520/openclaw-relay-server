"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
// WebSocket 消息类型
var MessageType;
(function (MessageType) {
    // 认证
    MessageType["AUTH_REQUEST"] = "auth_request";
    MessageType["AUTH_RESPONSE"] = "auth_response";
    MessageType["AUTH_LOGOUT"] = "auth_logout";
    // 聊天
    MessageType["CHAT_MESSAGE"] = "chat_message";
    MessageType["CHAT_RESPONSE"] = "chat_response";
    MessageType["CHAT_ACK"] = "chat_ack";
    // 心跳
    MessageType["PING"] = "ping";
    MessageType["PONG"] = "pong";
    // 设备
    MessageType["DEVICE_STATUS"] = "device_status";
    MessageType["DEVICE_LIST"] = "device_list";
    MessageType["DEVICE_BIND"] = "device_bind";
    MessageType["DEVICE_UNBIND"] = "device_unbind";
    // 错误
    MessageType["ERROR"] = "error";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=index.js.map