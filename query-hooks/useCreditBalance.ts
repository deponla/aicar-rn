import { getCreditBalance } from "@/api/get";
import { useQuery } from "@tanstack/react-query";

export enum CreditQueryKeys {
  BALANCE = "credit-balance",
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
