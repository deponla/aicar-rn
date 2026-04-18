import type { IPagination, IPaginationQuery } from "./utils";

export interface Favorite {
  id?: string;
  _id?: string;
  userId: string;
  warehouseId: string;
  categoryId: string;
  isActive: boolean;
  note?: string;
  alertEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteListResponse extends IPagination {
  results: Favorite[];
  count: number;
}

export interface FavoriteResponse {
  result: Favorite;
}

export interface FavoriteQuery extends IPaginationQuery {
  searchTerm?: string;
  categoryId?: string;
  alertEnabled?: boolean;
  includeInactive?: boolean;
  sort?: string;
}

export interface CreateFavoriteRequest {
  warehouseId: string;
  categoryId: string;
  note?: string;
  alertEnabled?: boolean;
}

export interface UpdateFavoriteRequest {
  note?: string;
  alertEnabled?: boolean;
}
