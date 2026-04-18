import { deleteFavorite } from "@/api/delete";
import { getFavorites } from "@/api/get";
import { patchFavorite } from "@/api/patch";
import { postFavorite } from "@/api/post";
import type {
  CreateFavoriteRequest,
  FavoriteQuery,
  UpdateFavoriteRequest,
} from "@/types/favorite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum FavoriteQueryKeys {
  FAVORITES = "favorites",
}

export const useGetFavorites = ({
  filters,
  enabled = true,
}: {
  filters?: FavoriteQuery;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: [FavoriteQueryKeys.FAVORITES, filters],
    queryFn: () => getFavorites(filters),
    enabled,
    gcTime: 0,
    staleTime: 0,
  });
};

export const useCreateFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFavoriteRequest) => postFavorite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FavoriteQueryKeys.FAVORITES],
      });
    },
  });
};

export const useUpdateFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFavoriteRequest;
    }) => patchFavorite(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FavoriteQueryKeys.FAVORITES],
      });
    },
  });
};

export const useDeleteFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FavoriteQueryKeys.FAVORITES],
      });
    },
  });
};
