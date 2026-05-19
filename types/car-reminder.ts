import { IPagination, IPaginationQuery } from "./utils";

export enum CarReminderTypeEnum {
  OIL_CHANGE = "oil_change",
  PERIODIC_MAINTENANCE = "periodic_maintenance",
  INSPECTION = "inspection",
}

export enum CarReminderStatusEnum {
  ACTIVE = "active",
  COMPLETED = "completed",
}

export interface CarReminder {
  id: string;
  userId: string;
  carId: string;
  type: CarReminderTypeEnum;
  status: CarReminderStatusEnum;
  notes?: string;
  lastCompletedAt?: string;
  lastCompletedMileage?: number;
  nextDueAt?: string;
  nextDueMileage?: number;
  remindDaysBefore?: number;
  remindMileageBefore?: number;
  lastNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CarReminderQuery extends IPaginationQuery {
  sort?: string;
  carId?: string;
  type?: CarReminderTypeEnum;
  status?: CarReminderStatusEnum;
}

export interface CreateCarReminderRequest {
  carId: string;
  type: CarReminderTypeEnum;
  notes?: string;
  status?: CarReminderStatusEnum;
  lastCompletedAt?: string;
  lastCompletedMileage?: number;
  nextDueAt?: string;
  nextDueMileage?: number;
  remindDaysBefore?: number;
  remindMileageBefore?: number;
}

export type UpdateCarReminderRequest = Partial<CreateCarReminderRequest>;

export interface CompleteCarReminderRequest {
  completedAt?: string;
  completedMileage?: number;
  nextDueAt?: string;
  nextDueMileage?: number;
}

export interface CarReminderResponse {
  result: CarReminder;
}

export interface CarReminderListResponse extends IPagination {
  results: CarReminder[];
  count: number;
}
