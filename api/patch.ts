import { DevicePermissions } from "@/types/device";
import { FavoriteResponse, UpdateFavoriteRequest } from "@/types/favorite";
import {
  FavoriteCategoriesResponse,
  UpdateFavoriteCategoriesRequest,
} from "@/types/favorite-categories";
import { UserGetResponse, UserUpdateRequest } from "@/types/user";
import { instance } from "./config";

// Favorites
export async function patchFavorite(
  id: string,
  payload: UpdateFavoriteRequest,
): Promise<FavoriteResponse> {
  return instance.patch(`v1/favorites/${id}`, payload).then((r) => r.data);
}

// Favorite Categories
export async function patchFavoriteCategory(
  id: string,
  payload: UpdateFavoriteCategoriesRequest,
): Promise<FavoriteCategoriesResponse> {
  return instance
    .patch(`v1/favorite-categories/${id}`, payload)
    .then((r) => r.data);
}

export async function patchUsers(
  id: string,
  d: UserUpdateRequest,
): Promise<UserGetResponse> {
  return instance.patch(`v1/users/${id}`, d).then((r) => r.data);
}

// Devices
export async function patchDevicePermissions(
  deviceId: string,
  permissions: DevicePermissions,
): Promise<void> {
  return instance
    .patch(`v1/devices/${deviceId}`, { permissions })
    .then((r) => r.data);
}
