import { DeviceInfo } from '../types';
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
export declare class DeviceService {
    bindDevice(userId: string, deviceId: string, deviceName: string, deviceType?: string, platform?: string, deviceInfo?: Record<string, any>, publicKey?: string): Promise<DeviceInfo>;
    unbindDevice(deviceId: string, userId: string): Promise<boolean>;
    getUserDevices(userId: string): Promise<DeviceInfo[]>;
    getDevice(deviceId: string): Promise<DeviceInfo | null>;
    updateDeviceStatus(deviceId: string, isOnline: boolean): Promise<void>;
    getDeviceOwner(deviceId: string): Promise<string | null>;
    isDeviceOwnedBy(deviceId: string, userId: string): Promise<boolean>;
}
declare const _default: DeviceService;
export default _default;
//# sourceMappingURL=DeviceService.d.ts.map