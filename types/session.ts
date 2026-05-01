export type SessionDeviceType = "MOBILE" | "DESKTOP" | "TABLET" | "UNKNOWN";

export type SessionPlatform =
  | "IOS"
  | "ANDROID"
  | "WEB"
  | "WINDOWS"
  | "MACOS"
  | "LINUX"
  | "UNKNOWN";

export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

export interface Session {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: SessionDeviceType;
  platform: SessionPlatform;
  userAgent: string;
  ipAddress: string;
  location: string;
  countryCode: string;
  loginAt: string;
  lastActiveAt: string;
  expiresAt: string;
  status: SessionStatus;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionListResponse {
  results: Session[];
  page: number;
  limit: number;
  count: number;
}

export interface SessionResponse {
  result: Session;
}
