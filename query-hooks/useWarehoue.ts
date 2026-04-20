import { getWarehouseByIdPublic, getWarehousesPublic } from "@/api/get";
import { WarehouseQueryParams } from "@/types/warehouse";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export enum WarehouseQueryKey {
  WAREHOUSES_PUBLIC = "WAREHOUSES_PUBLIC",
}

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
