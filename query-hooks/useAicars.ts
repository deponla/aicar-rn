import {
  getMyAicars,
  getAicar,
  getPublicAicars,
  getPublicAicar,
} from "@/api/get";
import { AicarQuery } from "@/types/aicar";
import { useQuery } from "@tanstack/react-query";

export enum AicarQueryKeys {
  MY_AICARS = "my-aicars",
  AICAR = "aicar",
  PUBLIC_AICARS = "public-aicars",
  PUBLIC_AICAR = "public-aicar",
}

export const useGetMyAicars = (
  filters?: AicarQuery,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [AicarQueryKeys.MY_AICARS, filters],
    queryFn: () => getMyAicars(filters),
    enabled,
  });
};

export const useGetAicar = (id: string, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [AicarQueryKeys.AICAR, id],
    queryFn: () => getAicar(id),
    enabled,
  });
};

export const useGetPublicAicars = (filters?: AicarQuery) => {
  return useQuery({
    queryKey: [AicarQueryKeys.PUBLIC_AICARS, filters],
    queryFn: () => getPublicAicars(filters),
  });
};

export const useGetPublicAicar = (id: string, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [AicarQueryKeys.PUBLIC_AICAR, id],
    queryFn: () => getPublicAicar(id),
    enabled,
  });
};
