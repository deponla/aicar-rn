import { getWarehouseRequests, getWarehouseRequestsById } from "@/api/get";
import {
  postWarehouseRequest,
  postWarehouseRequestConfirmUpload,
  postWarehouseRequestsUploadUrl,
} from "@/api/post";
import {
  WarehouseFilterQueryDto,
  WarehousePostRequest,
  WarehouseRequestConfirmUploadPostRequest,
} from "@/types/warehouse-requests";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export enum WarehouseRequestQueryKeys {
  WAREHOUSE_REQUEST = "WAREHOUSE_REQUEST",
}

export const useGetWarehouseRequests = ({
  enabled = true,
  filters,
}: {
  enabled?: boolean;
  filters?: WarehouseFilterQueryDto;
}) => {
  return useQuery({
    queryKey: [WarehouseRequestQueryKeys.WAREHOUSE_REQUEST, filters],
    queryFn: () => getWarehouseRequests({ filters }),
    enabled,
  });
};

export const useGetWarehouseRequestsInfinite = ({
  enabled = true,
  filters,
}: {
  enabled?: boolean;
  filters?: Omit<WarehouseFilterQueryDto, "page">;
}) => {
  return useInfiniteQuery({
    queryKey: [
      WarehouseRequestQueryKeys.WAREHOUSE_REQUEST,
      "infinite",
      filters,
    ],
    queryFn: ({ pageParam = 0 }) =>
      getWarehouseRequests({
        filters: { ...filters, page: pageParam, limit: 10 },
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.results.length >= (lastPage.limit || 10);
      return hasMore ? lastPage.page + 1 : undefined;
    },
    enabled,
  });
};

export const useGetWarehouseRequestById = (id: string) => {
  return useQuery({
    queryKey: [WarehouseRequestQueryKeys.WAREHOUSE_REQUEST, id],
    queryFn: () => getWarehouseRequestsById({ id }),
    enabled: !!id && id !== "new",
  });
};

export const usePostWarehouseRequest = () => {
  const query = useQueryClient();
  return useMutation({
    mutationFn: (d: WarehousePostRequest) => postWarehouseRequest(d),
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: [WarehouseRequestQueryKeys.WAREHOUSE_REQUEST],
      });
    },
  });
};

export const usePostWarehouseRequestsUploadUrl = () => {
  return useMutation({
    mutationFn: () => postWarehouseRequestsUploadUrl(),
  });
};

export const usePostWarehouseRequestConfirmUpload = () => {
  return useMutation({
    mutationFn: (d: WarehouseRequestConfirmUploadPostRequest) =>
      postWarehouseRequestConfirmUpload(d),
  });
};
