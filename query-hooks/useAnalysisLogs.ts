import { getAnalysisLogs } from "@/api/get";
import { useQuery } from "@tanstack/react-query";

export enum AnalysisLogQueryKeys {
  LOGS = "analysis-logs",
}

export interface AnalysisLogQuery {
  limit?: number;
  page?: number;
  carId?: string;
  sort?: string;
}

export const useGetAnalysisLogs = (filters?: AnalysisLogQuery) => {
  return useQuery({
    queryKey: [AnalysisLogQueryKeys.LOGS, filters],
    queryFn: () => getAnalysisLogs(filters),
    staleTime: 30_000,
  });
};
