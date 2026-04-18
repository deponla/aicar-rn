import type { IPagination, IPaginationQuery } from "./utils";

export interface FavoriteCategories {
  id?: string;
  name: string;
  description?: string;
  order?: number;
  isDefault?: boolean;
}

export interface FavoriteCategoriesListResponse extends IPagination {
  results: FavoriteCategories[];
  count: number;
}

export interface FavoriteCategoriesResponse {
  result: FavoriteCategories;
}

export interface FavoriteCategoriesQuery extends IPaginationQuery {
  name?: string;
}

export interface CreateFavoriteCategoriesRequest {
  name: string;
  description?: string;
  order?: number;
  isDefault?: boolean;
}

export interface UpdateFavoriteCategoriesRequest {
  name?: string;
  description?: string;
  order?: number;
  isDefault?: boolean;
}
