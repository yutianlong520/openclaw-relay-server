import winston from 'winston';
declare const logger: winston.Logger;
export default logger;
export declare const log: {
    info: (message: string, ...meta: any[]) => winston.Logger;
    warn: (message: string, ...meta: any[]) => winston.Logger;
    error: (message: string, ...meta: any[]) => winston.Logger;
    debug: (message: string, ...meta: any[]) => winston.Logger;
};
//# sourceMappingURL=logger.d.ts.map