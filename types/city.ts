import type { IPagination, IPaginationQuery } from "./utils";

export interface Province {
  _id: string;
  isDeleted: boolean;
  name: string;
}

export interface ProvinceListResponse extends IPagination {
  results: Province[];
}

export interface ProvinceResponse {
  result: Province;
}

export interface ProvinceQueryParameters extends IPaginationQuery {
  search?: string;
}

export interface District {
  _id: string;
  name: string;
  provinceId: string;
}

export interface DistrictListResponse extends IPagination {
  results: District[];
}

export interface DistrictResponse {
  result: District;
}

export interface DistrictQueryParameters extends IPaginationQuery {
  search?: string;
  provinceId?: string;
}

export interface Neighborhood {
  _id: string;
  name: string;
}

export interface NeighborhoodResponse {
  result: Neighborhood;
}

export interface NeighborhoodListResponse extends IPagination {
  results: Neighborhood[];
}

export interface NeighborhoodQueryParameters extends IPaginationQuery {
  search?: string;
  districtIds?: string[] | string;
}
