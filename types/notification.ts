import { IPaginationQuery } from "./utils";

enum NotificationStatus {
  SENT = "sent",
  FAILED = "failed",
}

export enum NotificationType {
  GENERAL = "general",
  PERSONAL = "personal",
  ALERT = "alert",
}

export interface Notification {
  id: string;
  userId?: string;
  token?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  type: NotificationType;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface NotificationListResponse {
  results: Notification[];
  page: number;
  limit: number;
  count: number;
}

export interface NotificationQuery extends IPaginationQuery {
  status?: NotificationStatus;
  sort?: string;
}
