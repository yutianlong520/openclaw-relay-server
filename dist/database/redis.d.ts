import Redis from 'ioredis';
export declare function initRedis(): Promise<Redis>;
export declare function getRedis(): Redis;
export declare function closeRedis(): Promise<void>;
export declare const sessionStore: {
    set(token: string, userId: string, expiresIn: number): Promise<void>;
    get(token: string): Promise<string | null>;
    delete(token: string): Promise<void>;
    refresh(token: string, expiresIn: number): Promise<void>;
};
export declare const deviceStore: {
    setOnline(deviceId: string, userId: string): Promise<void>;
    setOffline(deviceId: string): Promise<void>;
    isOnline(deviceId: string): Promise<boolean>;
    getUserOnlineDevices(userId: string): Promise<string[]>;
};
export declare const messageQueue: {
    push(queueName: string, message: string): Promise<void>;
    pop(queueName: string, timeout?: number): Promise<string | null>;
};
export declare const rateLimiter: {
    check(key: string, limit: number, windowSeconds: number): Promise<boolean>;
};
//# sourceMappingURL=redis.d.ts.map