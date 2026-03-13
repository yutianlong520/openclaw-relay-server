export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export declare function generateApiKey(): Promise<string>;
export declare function hashApiKey(key: string): Promise<string>;
export declare function verifyApiKey(key: string, keyHash: string): Promise<boolean>;
export declare function generateRandomString(length: number): Promise<string>;
export declare function sha256(data: string): string;
export declare function hmacSign(data: string, secret: string): string;
export declare function hmacVerify(data: string, signature: string, secret: string): boolean;
//# sourceMappingURL=crypto.d.ts.map