import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../database';
import { deviceStore } from '../database/redis';
import { log } from '../utils';
import { DeviceInfo } from '../types';

// 设备存储
export interface StoredDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  platform: string;
  device_info: Record<string, any>;
  public_key: string;
  last_seen_at: Date;
  is_online: boolean;
  created_at: Date;
}

export class DeviceService {
  // 绑定设备
  async bindDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    deviceType: string = 'unknown',
    platform: string = 'unknown',
    deviceInfo: Record<string, any> = {},
    publicKey?: string
  ): Promise<DeviceInfo> {
    const id = uuidv4();

    // 检查设备是否已存在
    const existing = await queryOne<StoredDevice>(
      `SELECT * FROM devices WHERE device_id = $1`,
      [deviceId]
    );

    if (existing) {
      // 更新设备信息
      await query(
        `UPDATE devices SET user_id = $1, device_name = $2, device_type = $3, platform = $4,
         device_info = $5, public_key = $6, last_seen_at = NOW(), is_online = true, updated_at = NOW()
         WHERE device_id = $7`,
        [userId, deviceName, deviceType, platform, JSON.stringify(deviceInfo), publicKey || null, deviceId]
      );
    } else {
      // 创建新设备
      await query(
        `INSERT INTO devices (id, user_id, device_id, device_name, device_type, platform, device_info, public_key, is_online, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())`,
        [id, userId, deviceId, deviceName, deviceType, platform, JSON.stringify(deviceInfo), publicKey || null]
      );
    }

    // 标记设备在线
    await deviceStore.setOnline(deviceId, userId);

    log.info(`Device bound: ${deviceId} for user ${userId}`);

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
  async unbindDevice(deviceId: string, userId: string): Promise<boolean> {
    await query(
      `DELETE FROM devices WHERE device_id = $1 AND user_id = $2`,
      [deviceId, userId]
    );

    await deviceStore.setOffline(deviceId);

    log.info(`Device unbound: ${deviceId} from user ${userId}`);
    return true;
  }

  // 获取用户设备列表
  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    const devices = await query<StoredDevice>(
      `SELECT * FROM devices WHERE user_id = $1 ORDER BY last_seen_at DESC`,
      [userId]
    );

    // 检查每个设备的在线状态
    const deviceInfos: DeviceInfo[] = [];
    for (const device of devices) {
      const isOnline = await deviceStore.isOnline(device.device_id);
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
  async getDevice(deviceId: string): Promise<DeviceInfo | null> {
    const device = await queryOne<StoredDevice>(
      `SELECT * FROM devices WHERE device_id = $1`,
      [deviceId]
    );

    if (!device) return null;

    const isOnline = await deviceStore.isOnline(deviceId);

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
  async updateDeviceStatus(deviceId: string, isOnline: boolean): Promise<void> {
    await query(
      `UPDATE devices SET is_online = $1, last_seen_at = NOW() WHERE device_id = $2`,
      [isOnline, deviceId]
    );

    if (isOnline) {
      // 获取设备所有者并设置在线
      const device = await this.getDevice(deviceId);
      if (device) {
        await deviceStore.setOnline(deviceId, device.deviceId);
      }
    } else {
      await deviceStore.setOffline(deviceId);
    }
  }

  // 获取设备所有者
  async getDeviceOwner(deviceId: string): Promise<string | null> {
    const device = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM devices WHERE device_id = $1`,
      [deviceId]
    );
    return device?.user_id || null;
  }

  // 检查设备是否属于用户
  async isDeviceOwnedBy(deviceId: string, userId: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM devices WHERE device_id = $1 AND user_id = $2) as exists`,
      [deviceId, userId]
    );
    return result?.exists || false;
  }
}

export default new DeviceService();
