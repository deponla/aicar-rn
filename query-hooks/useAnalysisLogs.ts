import { getAnalysisLogs } from "@/api/get";
import { normalizeLanguage } from "@/i18n";
import { AnalyzeMediaLog } from "@/types/ai";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

enum AnalysisLogQueryKeys {
  LOGS = "analysis-logs",
}

export interface AnalysisLogQuery {
  limit?: number;
  page?: number;
  carId?: string;
  sort?: string;
}

export const useGetAnalysisLogs = (
  filters?: AnalysisLogQuery,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [AnalysisLogQueryKeys.LOGS, filters, language],
    queryFn: () => getAnalysisLogs(filters),
    enabled,
    staleTime: 30_000,
  });
};
