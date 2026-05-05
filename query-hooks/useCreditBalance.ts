import { getCreditBalance, getCreditPackages, getMyAccount } from "@/api/get";
import { postPurchaseCredits, postVerifyReceipt } from "@/api/post";
import { PurchaseCreditsRequest, VerifyReceiptRequest } from "@/types/credit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum CreditQueryKeys {
  BALANCE = "credit-balance",
  PACKAGES = "credit-packages",
  ACCOUNT = "account",
}

export const useGetCreditBalance = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: [CreditQueryKeys.BALANCE],
    queryFn: getCreditBalance,
    enabled,
  });
};

export const useGetCreditPackages = () => {
  return useQuery({
    queryKey: [CreditQueryKeys.PACKAGES],
    queryFn: getCreditPackages,
  });
};

export const useGetMyAccount = ({ enabled = true } = {}) => {
  return useQuery({
    queryKey: [CreditQueryKeys.ACCOUNT],
    queryFn: getMyAccount,
    enabled,
  });
};

export const usePurchaseCredits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseCreditsRequest) =>
      postPurchaseCredits(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CreditQueryKeys.BALANCE] });
      queryClient.invalidateQueries({ queryKey: [CreditQueryKeys.ACCOUNT] });
    },
  });
};

export const useVerifyReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyReceiptRequest) => postVerifyReceipt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CreditQueryKeys.BALANCE] });
      queryClient.invalidateQueries({ queryKey: [CreditQueryKeys.ACCOUNT] });
    },
  });
};
