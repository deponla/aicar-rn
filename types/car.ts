import { IPaginationQuery } from "./utils";

export enum FuelTypeEnum {
  GASOLINE = "gasoline",
  DIESEL = "diesel",
  LPG = "lpg",
  ELECTRIC = "electric",
  HYBRID = "hybrid",
}

export enum TransmissionEnum {
  MANUAL = "manual",
  AUTOMATIC = "automatic",
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  category?: string;
  fuelType?: FuelTypeEnum;
  transmission?: TransmissionEnum;
  engineCC?: number;
  currentMileage?: number;
  nickname?: string;
  licensePlate?: string;
  color?: string;
  notes?: string;
  purchaseDate?: string;
  vin?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface CreateCarRequest {
  brand: string;
  model: string;
  year: number;
  category?: string;
  fuelType?: FuelTypeEnum;
  transmission?: TransmissionEnum;
  engineCC?: number;
  currentMileage?: number;
  nickname?: string;
  licensePlate?: string;
  color?: string;
  notes?: string;
  purchaseDate?: string;
}

export type UpdateCarRequest = Partial<CreateCarRequest>;

export interface CarResponse {
  result: Car;
}

export interface CarListResponse {
  results: Car[];
  page: number;
  limit: number;
  count: number;
}

export interface CarQuery extends IPaginationQuery {
  searchTerm?: string;
  brand?: string;
  year?: number;
  fuelType?: FuelTypeEnum;
  transmission?: TransmissionEnum;
}

export interface AnalysisResult {
  id: string;
  imageUrl?: string;
  description: string;
  urgency: "critical" | "warning" | "info";
  title: string;
  recommendation: string;
  createdAt: string;
  car?: Car;
}

export enum UrgencyLevel {
  CRITICAL = "critical",
  WARNING = "warning",
  INFO = "info",
}
