import Constants, { AppOwnership } from "expo-constants";
import { Platform } from "react-native";

export function canUseExpoNotifications(): boolean {
  return Platform.OS !== "web" && Constants.appOwnership !== AppOwnership.Expo;
}

export async function getNotificationPermissionStatus(): Promise<string> {
  if (!canUseExpoNotifications()) {
    return "undetermined";
  }

  const Notifications = await import("expo-notifications");
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
}

export async function requestNotificationPermissionStatus(): Promise<string> {
  if (!canUseExpoNotifications()) {
    return "undetermined";
  }

  const Notifications = await import("expo-notifications");
  const permissions = await Notifications.requestPermissionsAsync();
  return permissions.status;
}
