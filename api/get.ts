import { MeResponse } from "@/types/auth";
import { BlogListFilters, BlogListResponse, BlogResponse } from "@/types/blog";
import {
  ConversationListResponse,
  ConversationQuery,
  MessageListResponse,
  MessageQuery,
} from "@/types/chat";
import {
  DistrictListResponse,
  DistrictQueryParameters,
  DistrictResponse,
  NeighborhoodListResponse,
  NeighborhoodQueryParameters,
  NeighborhoodResponse,
  ProvinceListResponse,
  ProvinceQueryParameters,
  ProvinceResponse,
} from "@/types/city";
import { FavoriteListResponse, FavoriteQuery } from "@/types/favorite";
import {
  FavoriteCategoriesListResponse,
  FavoriteCategoriesQuery,
  FavoriteCategoriesResponse,
} from "@/types/favorite-categories";
import {
  WarehouseListResponse,
  WarehouseQueryParams,
  WarehouseResponse,
} from "@/types/warehouse";
import { instance } from "./config";

export async function getMe({ token }: { token: string }): Promise<MeResponse> {
  return instance
    .get("v1/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((r) => r.data);
}

export async function getWarehousesPublic({
  filters,
}: {
  filters?: WarehouseQueryParams;
}): Promise<WarehouseListResponse> {
  return instance
    .get("v1/warehouses/public", { params: filters })
    .then((r) => r.data);
}

export async function getWarehouseByIdPublic({
  id,
}: {
  id: string;
}): Promise<WarehouseResponse> {
  return instance.get(`v1/warehouses/${id}/public`).then((r) => r.data);
}

export async function getProvinces({
  filters,
}: {
  filters?: ProvinceQueryParameters;
}): Promise<ProvinceListResponse> {
  return instance
    .get("v1/locations/provinces", { params: filters })
    .then((r) => r.data);
}

export async function getDistricts({
  filters,
}: {
  filters?: DistrictQueryParameters;
}): Promise<DistrictListResponse> {
  return instance
    .get("v1/locations/districts", { params: filters })
    .then((r) => r.data);
}

export async function getProvinceById({
  id,
}: {
  id: string;
}): Promise<ProvinceResponse> {
  return instance.get(`v1/locations/provinces/${id}`).then((r) => r.data);
}

export async function getDistrictById({
  id,
}: {
  id: string;
}): Promise<DistrictResponse> {
  return instance.get(`v1/locations/districts/${id}`).then((r) => r.data);
}

export async function getNeighborhoodById({
  id,
}: {
  id?: string;
}): Promise<NeighborhoodResponse> {
  return instance
    .get(`v1/locations/neighborhoods/detail/${id}`)
    .then((r) => r.data);
}

export async function getNeighborhoods({
  filters,
}: {
  filters?: NeighborhoodQueryParameters;
}): Promise<NeighborhoodListResponse> {
  return instance
    .get(`v1/locations/neighborhoods`, { params: filters })
    .then((r) => r.data);
}

export async function getFavorites(
  filters?: FavoriteQuery,
): Promise<FavoriteListResponse> {
  return instance.get("v1/favorites", { params: filters }).then((r) => r.data);
}

export async function getFavoriteCategories(
  filters?: FavoriteCategoriesQuery,
): Promise<FavoriteCategoriesListResponse> {
  return instance
    .get("v1/favorite-categories", { params: filters })
    .then((r) => r.data);
}

export async function getFavoriteCategoryById({
  id,
}: {
  id: string;
}): Promise<FavoriteCategoriesResponse> {
  return instance.get(`v1/favorite-categories/${id}`).then((r) => r.data);
}

export async function getChatConversations(
  filters?: ConversationQuery,
): Promise<ConversationListResponse> {
  return instance
    .get("v1/chat/conversations", { params: filters })
    .then((r) => r.data);
}

export async function getChatMessages({
  conversationId,
  filters,
}: {
  conversationId: string;
  filters?: Omit<MessageQuery, "conversationId">;
}): Promise<MessageListResponse> {
  return instance
    .get(`v1/chat/conversations/${conversationId}/messages`, {
      params: filters,
    })
    .then((r) => r.data);
}

// ─── Blog ──────────────────────────────────────────────────────────────────────

export async function getBlogs({
  filters,
}: {
  filters?: BlogListFilters;
}): Promise<BlogListResponse> {
  return instance.get("v1/blogs", { params: filters }).then((r) => r.data);
}

export async function getBlogBySlug({
  slug,
}: {
  slug: string;
}): Promise<BlogResponse> {
  return instance.get(`v1/blogs/slug/${slug}`).then((r) => r.data);
}
