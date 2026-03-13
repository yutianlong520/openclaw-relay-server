// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证用户名格式
export function isValidUsername(username: string): boolean {
  // 3-20个字符，只能包含字母、数字、下划线
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// 验证密码强度
export function isValidPassword(password: string): boolean {
  // 至少8个字符，包含数字和字母
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
}

// 验证设备ID格式
export function isValidDeviceId(deviceId: string): boolean {
  // 1-64个字符
  return deviceId.length > 0 && deviceId.length <= 64;
}

// 验证消息类型
export function isValidMessageType(type: string): boolean {
  const validTypes = ['text', 'image', 'voice'];
  return validTypes.includes(type);
}

// 验证客户端类型
export function isValidClientType(type: string): boolean {
  return type === 'app' || type === 'claw';
}

// 清理和验证输入
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().slice(0, maxLength);
}

// 验证分页参数
export function validatePagination(page?: any, pageSize?: any): { page: number; pageSize: number } {
  const p = parseInt(page, 10) || 1;
  const ps = parseInt(pageSize, 10) || 20;
  
  return {
    page: Math.max(1, p),
    pageSize: Math.min(100, Math.max(1, ps)),
  };
}
