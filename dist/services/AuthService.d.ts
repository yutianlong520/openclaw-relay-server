import { ApiKey } from '../types';
export interface JWTPayload {
    userId: string;
    deviceId?: string;
    sessionId: string;
    type: 'access' | 'refresh';
}
export declare class AuthService {
    authenticateWithApiKey(key: string, deviceId?: string, _clientType?: 'app' | 'claw'): Promise<{
        token: string;
        userId: string;
        expiresAt: number;
    } | null>;
    verifyToken(token: string): Promise<JWTPayload | null>;
    createApiKey(userId: string, name: string, permissions?: Record<string, any>): Promise<string>;
    deleteApiKey(keyId: string, userId: string): Promise<boolean>;
    getApiKeys(userId: string): Promise<ApiKey[]>;
    logout(token: string, deviceId?: string): Promise<void>;
    refreshToken(oldToken: string): Promise<{
        token: string;
        expiresAt: number;
    } | null>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=AuthService.d.ts.map