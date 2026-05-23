import { IPagination, IPaginationQuery } from "./utils";

export interface CarBrand {
  id: string;
  name: string;
  isOther: boolean;
  isActive: boolean;
}

export interface CarModel {
  id: string;
  name: string;
  makeId: string;
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
