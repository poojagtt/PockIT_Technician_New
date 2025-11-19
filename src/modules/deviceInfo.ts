import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

export const getDeviceDetails = async () => {
  try {
    const deviceId = await DeviceInfo.getUniqueId();
    const deviceName = await DeviceInfo.getDeviceName();
    const systemVersion = DeviceInfo.getSystemVersion();
    const ipAddress = await DeviceInfo.getIpAddress();
    const model = DeviceInfo.getModel();
    const brand = DeviceInfo.getBrand();
    const buildNumber = DeviceInfo.getBuildNumber();
    const appVersion = DeviceInfo.getVersion();

    return {
      deviceId,
      deviceName,
      systemVersion,
      ipAddress,
      model,
      brand,
      buildNumber,
      appVersion,
      sessionKey: `${deviceId}_${Date.now()}` // Generate a unique session key
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return null;
  }
}; 