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
import { ImageItem } from "./warehouse-requests";

export interface WarehouseLocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface WarehouseAddress {
  location: WarehouseLocation;
  addressContent: string;
  country: string;
  countryCode: string;
  city: string;
  district: string;
  postalCode: string;
  utcOffsetMinutes: number | undefined;
  neighborhood: string;
}

export enum WarehouseStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export interface Warehouse {
  id: string;
  name: string | null;
  description: string | null;
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
  ownUserId: string;
  createdAt: string;
  updatedAt: string;
  images: ImageItem[];
  status: "ACTIVE" | "INACTIVE";
}

export interface WarehouseListResponse extends IPagination {
  results: Warehouse[];
}

export interface WarehouseResponse {
  result: Warehouse;
}

export interface WarehouseQueryParams extends IPaginationQuery {
  ownUserId?: string;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  minPrice?: number;
  maxPrice?: number;
  storageType?: WarehouseCategories;
  rentOrSale?: RentOrSale;
  minSize?: number;
  maxSize?: number;
  accessType?: string;
  securityFeatures?: string;
  vehicleAccessibility?: string;
  districtId?: string | string[];
  provinceId?: string;
  neighborhoodId?: string | string[];
  sort?: string; // createdAt:asc, price:desc
}
