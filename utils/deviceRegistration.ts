import * as Device from "expo-device";
import * as Application from "expo-application";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { postRegisterDevice } from "@/api/post";
import { patchDevicePermissions } from "@/api/patch";
import type { DevicePermissions, PermissionStatus } from "@/types/device";

export const DEVICE_ID_KEY = "device_id";

function toPermissionStatus(status: string): PermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

async function gatherPermissions(): Promise<DevicePermissions> {
  const [notif, loc, photos] = await Promise.all([
    Notifications.getPermissionsAsync().catch(() => ({
      status: "undetermined" as const,
    })),
    Location.getForegroundPermissionsAsync().catch(() => ({
      status: "undetermined" as const,
    })),
    ImagePicker.getMediaLibraryPermissionsAsync().catch(() => ({
      status: "undetermined" as const,
    })),
  ]);
  return {
    notifications: toPermissionStatus(notif.status),
    location: toPermissionStatus(loc.status),
    mediaLibrary: toPermissionStatus(photos.status),
  };
}

/**
 * Login sonrası çağrılır. Cihazı backend'e kaydeder (upsert),
 * dönen deviceId'yi SecureStore'a yazar ve izinleri sync eder.
 */
export async function registerDeviceAfterLogin(
  expoPushToken?: string,
): Promise<string | null> {
  try {
    const platform: "ios" | "android" | "web" =
      Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
          ? "android"
          : "web";

    const permissions = await gatherPermissions();

    const payload = {
      platform,
      tokenType: "expo" as const,
      ...(expoPushToken ? { expoPushToken } : {}),
      model: Device.modelName ?? undefined,
      osVersion: Device.osVersion ?? undefined,
      appVersion: Application.nativeApplicationVersion ?? undefined,
      permissions,
    };

    const device = await postRegisterDevice(payload);
    await SecureStore.setItemAsync(DEVICE_ID_KEY, device.id);
    return device.id;
  } catch {
    return null;
  }
}

/**
 * Mevcut deviceId'yi SecureStore'dan okur.
 */
export async function getStoredDeviceId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * İzin değiştiğinde çağrılır. deviceId yoksa kayıt yapar.
 */
export async function syncPermissions(
  partial: DevicePermissions,
  expoPushToken?: string,
): Promise<void> {
  try {
    let deviceId = await getStoredDeviceId();
    if (!deviceId) {
      deviceId = await registerDeviceAfterLogin(expoPushToken);
    }
    if (!deviceId) return;
    await patchDevicePermissions(deviceId, partial);
  } catch {
    // sessizce geç
  }
}
