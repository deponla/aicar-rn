import { IPagination, IPaginationQuery } from "./utils";

interface CarBrand {
  id: string;
  name: string;
  isOther: boolean;
  isActive: boolean;
  logo?: string;
  catalogBrandId?: string;
}

interface CarModel {
  id: string;
  name: string;
  makeId: string;
  catalogModelId?: string;
  hasEngines?: boolean;
}

interface CarEngine {
  id: string;
  name: string;
  modelId: string;
  specs: Record<string, Record<string, string>>;
}

export interface CarBrandQuery extends IPaginationQuery {
  search?: string;
}

export interface CarModelQuery extends IPaginationQuery {
  search?: string;
}

export interface CarBrandListResponse extends IPagination {
  results: CarBrand[];
  count: number;
}

export interface CarModelListResponse extends IPagination {
  results: CarModel[];
  count: number;
}

export interface CarEngineListResponse {
  results: CarEngine[];
  count: number;
}
