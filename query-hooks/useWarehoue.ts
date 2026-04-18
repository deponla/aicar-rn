import {
  getWarehouseById,
  getWarehouseByIdPublic,
  getWarehouses,
  getWarehousesPublic,
} from "@/api/get";
import { patchWarehouseStatus } from "@/api/patch";
import { WarehouseQueryParams } from "@/types/warehouse";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export enum WarehouseQueryKey {
  WAREHOUSE = "WAREHOUSE",
  WAREHOUSES_PUBLIC = "WAREHOUSES_PUBLIC",
}

export const useGetWarehouses = ({
  enabled = true,
  filters,
}: {
  enabled?: boolean;
  filters?: WarehouseQueryParams;
}) => {
  return useQuery({
    queryKey: [WarehouseQueryKey.WAREHOUSE, filters],
    queryFn: () => getWarehouses({ filters }),
    enabled,
  });
};

export const useGetWarehousesInfinite = ({
  enabled = true,
  filters,
}: {
  enabled?: boolean;
  filters?: Omit<WarehouseQueryParams, "page">;
}) => {
  return useInfiniteQuery({
    queryKey: [WarehouseQueryKey.WAREHOUSE, "infinite", filters],
    queryFn: ({ pageParam = 0 }) =>
      getWarehouses({ filters: { ...filters, page: pageParam, limit: 20 } }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.results.length >= (lastPage.limit || 20);
      return hasMore ? lastPage.page + 1 : undefined;
    },
    enabled,
  });
};

export const useGetWarehouseById = (id: string) => {
  return useQuery({
    queryKey: [WarehouseQueryKey.WAREHOUSE, id],
    queryFn: () => getWarehouseById({ id }),
    enabled: !!id && id !== "new",
  });
};

export function useWarehousePublic({
  filters,
  enabled = true,
}: {
  filters?: WarehouseQueryParams;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [WarehouseQueryKey.WAREHOUSES_PUBLIC, filters],
    queryFn: async () => {
      return getWarehousesPublic({ filters });
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useWarehousePublicById({
  id,
  enabled = true,
}: {
  id?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [WarehouseQueryKey.WAREHOUSES_PUBLIC, id],
    queryFn: async () => {
      return getWarehouseByIdPublic({ id: id! });
    },
    enabled,
  });
}

export const usePatchWarehouseStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "INACTIVE";
    }) => patchWarehouseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [WarehouseQueryKey.WAREHOUSE],
      });
    },
  });
};
