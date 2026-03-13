import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { promisify } from 'util';

const pbkdf2Async = promisify(crypto.pbkdf2);
const randomBytesAsync = promisify(crypto.randomBytes);

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成 API Key
export async function generateApiKey(): Promise<string> {
  const buf = await randomBytesAsync(32);
  return `oc_${buf.toString('hex')}`;
}

// API Key 哈希
export async function hashApiKey(key: string): Promise<string> {
  const salt = await randomBytesAsync(16);
  const hash = await pbkdf2Async(key, salt, 100000, 64, 'sha512');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

// 验证 API Key
export async function verifyApiKey(key: string, keyHash: string): Promise<boolean> {
  const [salt, hash] = keyHash.split(':');
  const verifyHash = await pbkdf2Async(key, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
  return hash === verifyHash.toString('hex');
}

// 生成随机字符串
export async function generateRandomString(length: number): Promise<string> {
  const buf = await randomBytesAsync(length);
  return buf.toString('base64url');
}

// SHA256 哈希
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// HMAC 签名
export function hmacSign(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// 验证 HMAC 签名
export function hmacVerify(data: string, signature: string, secret: string): boolean {
  const expected = hmacSign(data, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
