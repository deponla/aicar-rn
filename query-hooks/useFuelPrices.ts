import { getFuelPriceSummary, getFuelPrices } from "@/api/get";
import { FuelPriceQuery } from "@/types/fuel-price";
import { useQuery } from "@tanstack/react-query";

enum FuelPriceQueryKeys {
  FUEL_PRICES = "fuel-prices",
  FUEL_PRICE_SUMMARY = "fuel-price-summary",
}

export const useGetFuelPrices = (
  filters?: FuelPriceQuery,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [FuelPriceQueryKeys.FUEL_PRICES, filters],
    queryFn: () => getFuelPrices(filters),
    enabled,
    staleTime: 1000 * 60 * 30, // 30 min
  });
};

export const useGetFuelPriceSummary = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: [FuelPriceQueryKeys.FUEL_PRICE_SUMMARY],
    queryFn: () => getFuelPriceSummary(),
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
