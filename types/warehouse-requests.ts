import {
  AccessTypes,
  AppropriateProductAttributes,
  Currency,
  DetectorAndAlarmTypes,
  RentOrSale,
  SecurityCameraTypes,
  SecurityFeatures,
  VehicleAccesibility,
  WarehouseAreaTypes,
  WarehouseCategories,
} from "@/store/useWarehouse";
import { IPagination, IPaginationQuery } from "./utils";
import { WarehouseAddress } from "./warehouse";

export enum WarehouseRequestStatusEnum {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  UPDATED = "UPDATED",
}

export interface ImageItem {
  key: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export enum WarehouseRequestType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
}

export interface WarehouseRequest {
  id: string;
  warehouseId?: null | string;
  requestedByUserId?: string;
  name: string | null;
  description: string | null;
  status?: WarehouseRequestStatusEnum;
  requestType?: WarehouseRequestType;
  storageType: WarehouseCategories[] | null;
  address: WarehouseAddress | null;
  price: number | null;
  currency: Currency;
  rentOrSale: RentOrSale;
  areaType: WarehouseAreaTypes[] | null;
  indoorAreaSize: number | null;
  outdoorAreaSize: number | null;
  appropriateProductAttributes: AppropriateProductAttributes[] | null;
  securityFeatures: SecurityFeatures[] | null;
  securityCameraTypes: SecurityCameraTypes[] | null;
  detectorAndAlarmTypes: DetectorAndAlarmTypes[] | null;
  accessTypes: AccessTypes[] | null;
  vehicleAccessibility: VehicleAccesibility[] | null;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  images?: ImageItem[];
}

export type WarehousePostRequest = Omit<
  WarehouseRequest,
  "id" | "status" | "createdAt" | "updatedAt" | "reviewNotes" | "reviewedAt"
>;

export interface WarehouseResponse {
  result: WarehouseRequest;
}

export interface WarehouseListResponse extends IPagination {
  results: WarehouseRequest[];
}

export interface WarehouseFilterQueryDto extends IPaginationQuery {
  name?: string;
}

export interface WarehouseRequestsUploadUrlPostResponse {
  url: string;
  id: string;
}

export interface WarehouseRequestConfirmUploadPostRequest {
  id: string;
  requestId: string;
}

export interface WarehouseRequestConfirmUploadPostResponse {
  success: boolean;
  message: string;
  photoUrl: string;
  requestId: string;
}
