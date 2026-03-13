export interface AppConfig {
    port: number;
    host: string;
    nodeEnv: string;
    database: {
        url: string;
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    api: {
        keyExpiresDays: number;
    };
    logging: {
        level: string;
        file: string;
    };
    websocket: {
        heartbeatInterval: number;
        heartbeatTimeout: number;
        maxPayloadSize: number;
    };
}
declare const config: AppConfig;
export default config;
//# sourceMappingURL=index.d.ts.map