"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidUsername = isValidUsername;
exports.isValidPassword = isValidPassword;
exports.isValidDeviceId = isValidDeviceId;
exports.isValidMessageType = isValidMessageType;
exports.isValidClientType = isValidClientType;
exports.sanitizeInput = sanitizeInput;
exports.validatePagination = validatePagination;
// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// 验证用户名格式
function isValidUsername(username) {
    // 3-20个字符，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
}
// 验证密码强度
function isValidPassword(password) {
    // 至少8个字符，包含数字和字母
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}
// 验证设备ID格式
function isValidDeviceId(deviceId) {
    // 1-64个字符
    return deviceId.length > 0 && deviceId.length <= 64;
}
// 验证消息类型
function isValidMessageType(type) {
    const validTypes = ['text', 'image', 'voice'];
    return validTypes.includes(type);
}
// 验证客户端类型
function isValidClientType(type) {
    return type === 'app' || type === 'claw';
}
// 清理和验证输入
function sanitizeInput(input, maxLength = 1000) {
    if (typeof input !== 'string') {
        return '';
    }
    return input.trim().slice(0, maxLength);
}
// 验证分页参数
function validatePagination(page, pageSize) {
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;
    return {
        page: Math.max(1, p),
        pageSize: Math.min(100, Math.max(1, ps)),
    };
}
//# sourceMappingURL=validator.js.map