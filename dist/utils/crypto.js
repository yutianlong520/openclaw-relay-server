"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.verifyApiKey = verifyApiKey;
exports.generateRandomString = generateRandomString;
exports.sha256 = sha256;
exports.hmacSign = hmacSign;
exports.hmacVerify = hmacVerify;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const util_1 = require("util");
const pbkdf2Async = (0, util_1.promisify)(crypto_1.default.pbkdf2);
const randomBytesAsync = (0, util_1.promisify)(crypto_1.default.randomBytes);
// 密码哈希
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
// 验证密码
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
// 生成 API Key
async function generateApiKey() {
    const buf = await randomBytesAsync(32);
    return `oc_${buf.toString('hex')}`;
}
// API Key 哈希
async function hashApiKey(key) {
    const salt = await randomBytesAsync(16);
    const hash = await pbkdf2Async(key, salt, 100000, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
}
// 验证 API Key
async function verifyApiKey(key, keyHash) {
    const [salt, hash] = keyHash.split(':');
    const verifyHash = await pbkdf2Async(key, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
}
// 生成随机字符串
async function generateRandomString(length) {
    const buf = await randomBytesAsync(length);
    return buf.toString('base64url');
}
// SHA256 哈希
function sha256(data) {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
}
// HMAC 签名
function hmacSign(data, secret) {
    return crypto_1.default.createHmac('sha256', secret).update(data).digest('hex');
}
// 验证 HMAC 签名
function hmacVerify(data, signature, secret) {
    const expected = hmacSign(data, secret);
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
//# sourceMappingURL=crypto.js.map