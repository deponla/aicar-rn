export enum FuelType {
  GASOLINE = "gasoline",
  DIESEL = "diesel",
  LPG = "lpg",
}

export interface StationPrice {
  brand: string;
  price: number;
  premiumPrice?: number;
}

export interface FuelPriceItem {
  id?: string;
  city: string;
  district?: string;
  fuelType: FuelType;
  stations: StationPrice[];
  minPrice?: number;
  maxPrice?: number;
  avgPrice?: number;
  fetchedAt: string;
}

export interface FuelPriceListResponse {
  results: FuelPriceItem[];
  count: number;
}

export interface CitySummaryItem {
  city: string;
  gasoline?: number;
  diesel?: number;
  lpg?: number;
  updatedAt: string;
}

export interface CitySummaryResponse {
  results: CitySummaryItem[];
  count: number;
}

export interface FuelPriceQuery {
  city?: string;
  district?: string;
  fuelType?: FuelType;
}
