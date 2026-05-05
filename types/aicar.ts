import { IPaginationQuery } from "./utils";

export enum AicarStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  REJECTED = "REJECTED",
}

export enum AicarListingType {
  SELL = "SELL",
  BUY = "BUY",
}

export enum AicarCondition {
  NEW = "NEW",
  USED = "USED",
  DAMAGED = "DAMAGED",
}

export enum AicarFuelType {
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
  LPG = "LPG",
}

export enum AicarTransmission {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
  SEMI_AUTOMATIC = "SEMI_AUTOMATIC",
}

export enum Currency {
  TRY = "TRY",
  USD = "USD",
  EUR = "EUR",
}

export interface AicarImage {
  key: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface AicarVideo {
  videoId: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  uploadedAt: string;
}

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface AicarAddress {
  location?: GeoPoint;
  addressContent: string;
  country: string;
  countryCode?: string;
  city: string;
  district?: string;
  neighborhood?: string;
  postalCode: string;
  utcOffsetMinutes?: number;
}

export interface Aicar {
  id: string;
  ownUserId?: string;
  name?: string;
  status: AicarStatus;
  description?: string;
  listingType?: AicarListingType;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  condition?: AicarCondition;
  fuelType?: AicarFuelType;
  transmission?: AicarTransmission;
  engineCC?: number;
  color?: string;
  vin?: string;
  price?: number;
  currency?: Currency;
  address?: AicarAddress;
  images?: AicarImage[];
  videos?: AicarVideo[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface AicarResponse {
  result: Aicar;
}

export interface AicarListResponse {
  results: Aicar[];
  page: number;
  limit: number;
  count: number;
}

export interface AicarQuery extends IPaginationQuery {
  sort?: string;
  searchTerm?: string;
  listingType?: AicarListingType;
  brand?: string;
  model?: string;
  condition?: AicarCondition;
  fuelType?: AicarFuelType;
  transmission?: AicarTransmission;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  minPrice?: number;
  maxPrice?: number;
}
