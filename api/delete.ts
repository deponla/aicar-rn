import { instance } from "./config";
import { SessionResponse } from "@/types/session";

// Favorites
export async function deleteFavorite(id: string): Promise<void> {
  return instance.delete(`v1/favorites/${id}`).then((r) => r.data);
}

// Favorite Categories
export async function deleteFavoriteCategory(id: string): Promise<void> {
  return instance.delete(`v1/favorite-categories/${id}`).then((r) => r.data);
}

// Sessions
export async function deleteSession(id: string): Promise<SessionResponse> {
  return instance.delete(`v1/sessions/${id}`).then((r) => r.data);
}
