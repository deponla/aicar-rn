import { deleteFavoriteCategory } from "@/api/delete";
import { getFavoriteCategories, getFavoriteCategoryById } from "@/api/get";
import { patchFavoriteCategory } from "@/api/patch";
import { postFavoriteCategory } from "@/api/post";
import type {
  CreateFavoriteCategoriesRequest,
  FavoriteCategoriesQuery,
  UpdateFavoriteCategoriesRequest,
} from "@/types/favorite-categories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum FavoriteCategoriesQueryKeys {
  FAVORITE_CATEGORIES = "favorite-categories",
}

export const useGetFavoriteCategories = ({
  filters,
  enabled = true,
}: {
  filters?: FavoriteCategoriesQuery;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: [FavoriteCategoriesQueryKeys.FAVORITE_CATEGORIES, filters],
    queryFn: () => getFavoriteCategories(filters),
    enabled,
    gcTime: 0,
    staleTime: 0,
  });
};

export const useGetFavoriteCategoryById = ({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [FavoriteCategoriesQueryKeys.FAVORITE_CATEGORIES, id],
    queryFn: () => getFavoriteCategoryById({ id }),
    enabled: enabled && !!id,
  });
};

export const useCreateFavoriteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFavoriteCategoriesRequest) =>
      postFavoriteCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FavoriteCategoriesQueryKeys.FAVORITE_CATEGORIES],
      });
    },
  });
};

export const useUpdateFavoriteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFavoriteCategoriesRequest;
    }) => patchFavoriteCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FavoriteCategoriesQueryKeys.FAVORITE_CATEGORIES],
      });
    },
  });
};

export const useDeleteFavoriteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFavoriteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FavoriteCategoriesQueryKeys.FAVORITE_CATEGORIES],
      });
    },
  });
};
