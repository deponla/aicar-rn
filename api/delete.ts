import { instance } from "./config";

// Favorites
export async function deleteFavorite(id: string): Promise<void> {
  return instance.delete(`v1/favorites/${id}`).then((r) => r.data);
}

// Favorite Categories
export async function deleteFavoriteCategory(id: string): Promise<void> {
  return instance.delete(`v1/favorite-categories/${id}`).then((r) => r.data);
}
