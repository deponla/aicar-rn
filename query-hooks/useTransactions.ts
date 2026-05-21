import { getTransactions, getTransaction } from "@/api/get";
import { normalizeLanguage } from "@/i18n";
import { TransactionQuery } from "@/types/credit";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export enum TransactionQueryKeys {
  TRANSACTIONS = "transactions",
  TRANSACTION = "transaction",
}

export const useGetTransactions = (filters?: TransactionQuery) => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [TransactionQueryKeys.TRANSACTIONS, filters, language],
    queryFn: () => getTransactions(filters),
  });
};

export const useGetTransaction = (id: string, { enabled = true } = {}) => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [TransactionQueryKeys.TRANSACTION, id, language],
    queryFn: () => getTransaction(id),
    enabled,
  });
};
