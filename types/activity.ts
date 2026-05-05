import { IPaginationQuery } from "./utils";

export enum ActivityActionTypeEnum {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  Login = "login",
  ChangePassword = "changePassword",
  ForgotPassword = "forgotPassword",
  ResetPassword = "resetPassword",
  Register = "register",
}

export enum ActivityReferenceEnum {
  User = "user",
  Feedback = "feedback",
  Notification = "notification",
  System = "system",
  Aicar = "aicar",
  Session = "session",
  Device = "device",
}

export interface Activity {
  id: string;
  creatorUserId: string;
  date: string;
  actionType: ActivityActionTypeEnum;
  diff: object | null;
  reference: ActivityReferenceEnum | null;
  referenceId: string | null;
  userAgent: object | null;
  userIpAddressObject: object;
}

export interface ActivityResponse {
  result: Activity;
}

export interface ActivityListResponse {
  results: Activity[];
  page: number;
  limit: number;
  count: number;
}

export interface ActivityQuery extends IPaginationQuery {
  sort?: string;
  orderBy?: "date";
  orderDirection?: "asc" | "desc";
  creatorUserId?: string;
}
