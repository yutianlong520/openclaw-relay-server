"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceService = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../database");
const redis_1 = require("../database/redis");
const utils_1 = require("../utils");
class DeviceService {
    // 绑定设备
    async bindDevice(userId, deviceId, deviceName, deviceType = 'unknown', platform = 'unknown', deviceInfo = {}, publicKey) {
        const id = (0, uuid_1.v4)();
        // 检查设备是否已存在
        const existing = await (0, database_1.queryOne)(`SELECT * FROM devices WHERE device_id = $1`, [deviceId]);
        if (existing) {
            // 更新设备信息
            await (0, database_1.query)(`UPDATE devices SET user_id = $1, device_name = $2, device_type = $3, platform = $4,
         device_info = $5, public_key = $6, last_seen_at = NOW(), is_online = true, updated_at = NOW()
         WHERE device_id = $7`, [userId, deviceName, deviceType, platform, JSON.stringify(deviceInfo), publicKey || null, deviceId]);
        }
        else {
            // 创建新设备
            await (0, database_1.query)(`INSERT INTO devices (id, user_id, device_id, device_name, device_type, platform, device_info, public_key, is_online, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())`, [id, userId, deviceId, deviceName, deviceType, platform, JSON.stringify(deviceInfo), publicKey || null]);
        }
        // 标记设备在线
        await redis_1.deviceStore.setOnline(deviceId, userId);
        utils_1.log.info(`Device bound: ${deviceId} for user ${userId}`);
        return {
            deviceId,
            deviceName,
            deviceType,
            platform,
            isOnline: true,
            lastSeenAt: new Date(),
        };
    }
    // 解绑设备
    async unbindDevice(deviceId, userId) {
        await (0, database_1.query)(`DELETE FROM devices WHERE device_id = $1 AND user_id = $2`, [deviceId, userId]);
        await redis_1.deviceStore.setOffline(deviceId);
        utils_1.log.info(`Device unbound: ${deviceId} from user ${userId}`);
        return true;
    }
    // 获取用户设备列表
    async getUserDevices(userId) {
        const devices = await (0, database_1.query)(`SELECT * FROM devices WHERE user_id = $1 ORDER BY last_seen_at DESC`, [userId]);
        // 检查每个设备的在线状态
        const deviceInfos = [];
        for (const device of devices) {
            const isOnline = await redis_1.deviceStore.isOnline(device.device_id);
            deviceInfos.push({
                deviceId: device.device_id,
                deviceName: device.device_name,
                deviceType: device.device_type,
                platform: device.platform,
                isOnline,
                lastSeenAt: device.last_seen_at,
            });
        }
        return deviceInfos;
    }
    // 获取设备信息
    async getDevice(deviceId) {
        const device = await (0, database_1.queryOne)(`SELECT * FROM devices WHERE device_id = $1`, [deviceId]);
        if (!device)
            return null;
        const isOnline = await redis_1.deviceStore.isOnline(deviceId);
        return {
            deviceId: device.device_id,
            deviceName: device.device_name,
            deviceType: device.device_type,
            platform: device.platform,
            isOnline,
            lastSeenAt: device.last_seen_at,
        };
    }
    // 更新设备在线状态
    async updateDeviceStatus(deviceId, isOnline) {
        await (0, database_1.query)(`UPDATE devices SET is_online = $1, last_seen_at = NOW() WHERE device_id = $2`, [isOnline, deviceId]);
        if (isOnline) {
            // 获取设备所有者并设置在线
            const device = await this.getDevice(deviceId);
            if (device) {
                await redis_1.deviceStore.setOnline(deviceId, device.deviceId);
            }
        }
        else {
            await redis_1.deviceStore.setOffline(deviceId);
        }
    }
    // 获取设备所有者
    async getDeviceOwner(deviceId) {
        const device = await (0, database_1.queryOne)(`SELECT user_id FROM devices WHERE device_id = $1`, [deviceId]);
        return device?.user_id || null;
    }
    // 检查设备是否属于用户
    async isDeviceOwnedBy(deviceId, userId) {
        const result = await (0, database_1.queryOne)(`SELECT EXISTS(SELECT 1 FROM devices WHERE device_id = $1 AND user_id = $2) as exists`, [deviceId, userId]);
        return result?.exists || false;
    }
}
exports.DeviceService = DeviceService;
exports.default = new DeviceService();
//# sourceMappingURL=DeviceService.js.map