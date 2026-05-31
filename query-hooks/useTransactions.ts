import { getTransactions } from "@/api/get";
import { normalizeLanguage } from "@/i18n";
import { TransactionQuery } from "@/types/credit";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

enum TransactionQueryKeys {
  TRANSACTIONS = "transactions",
}

export const useGetTransactions = (filters?: TransactionQuery) => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [TransactionQueryKeys.TRANSACTIONS, filters, language],
    queryFn: () => getTransactions(filters),
  });
};
