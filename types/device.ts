export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface DevicePermissions {
  notifications?: PermissionStatus;
  location?: PermissionStatus;
  camera?: PermissionStatus;
  mediaLibrary?: PermissionStatus;
}

export interface RegisterDevicePayload {
  platform: "ios" | "android" | "web";
  tokenType: "expo" | "web_push";
  expoPushToken?: string;
  permissions?: DevicePermissions;
  model?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface DeviceResponse {
  id: string;
  userId: string;
  platform: "ios" | "android" | "web";
  tokenType: "expo" | "web_push";
  expoPushToken?: string;
  permissions?: DevicePermissions;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  createdAt: string;
  updatedAt: string;
}
