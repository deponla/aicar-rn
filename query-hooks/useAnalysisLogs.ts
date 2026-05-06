import { getAnalysisLogs } from "@/api/get";
import { AnalyzeMediaLog } from "@/types/ai";
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

export interface AnalysisLogListResponse {
  results: AnalyzeMediaLog[];
  count: number;
  page: number;
  limit: number;
}

export const useGetAnalysisLogs = (filters?: AnalysisLogQuery) => {
  return useQuery({
    queryKey: [AnalysisLogQueryKeys.LOGS, filters],
    queryFn: () => getAnalysisLogs(filters) as Promise<AnalysisLogListResponse>,
    staleTime: 30_000,
  });
};
