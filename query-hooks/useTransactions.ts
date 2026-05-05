import { getTransactions, getTransaction } from "@/api/get";
import { TransactionQuery } from "@/types/credit";
import { useQuery } from "@tanstack/react-query";

export enum TransactionQueryKeys {
  TRANSACTIONS = "transactions",
  TRANSACTION = "transaction",
}

export const useGetTransactions = (filters?: TransactionQuery) => {
  return useQuery({
    queryKey: [TransactionQueryKeys.TRANSACTIONS, filters],
    queryFn: () => getTransactions(filters),
  });
};

export const useGetTransaction = (id: string, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [TransactionQueryKeys.TRANSACTION, id],
    queryFn: () => getTransaction(id),
    enabled,
  });
};
