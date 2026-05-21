import { getCreditBalance, getCreditPackages, getMyAccount } from "@/api/get";
import { normalizeLanguage } from "@/i18n";
import { postPurchaseCredits, postVerifyReceipt } from "@/api/post";
import { PurchaseCreditsRequest, VerifyReceiptRequest } from "@/types/credit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [CreditQueryKeys.PACKAGES, language],
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
