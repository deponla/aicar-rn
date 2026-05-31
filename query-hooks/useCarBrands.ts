import { getCarBrands, getCarEngines, getCarModels } from "@/api/get";
import { CarBrandQuery, CarModelQuery } from "@/types/car-brand";
import { useQuery } from "@tanstack/react-query";

enum CarBrandQueryKeys {
  BRANDS = "car-brands",
  MODELS = "car-models",
  ENGINES = "car-engines",
}

export function useGetCarBrands(
  filters?: CarBrandQuery,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [CarBrandQueryKeys.BRANDS, filters],
    queryFn: () => getCarBrands(filters),
    enabled,
  });
}

export function useGetCarModels({
  brandId,
  filters,
  enabled = true,
}: {
  brandId?: string;
  filters?: CarModelQuery;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [CarBrandQueryKeys.MODELS, brandId, filters],
    queryFn: () => getCarModels({ brandId: brandId!, filters }),
    enabled: Boolean(brandId) && enabled,
  });
}

export function useGetCarEngines({
  catalogModelId,
  enabled = true,
}: {
  catalogModelId?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [CarBrandQueryKeys.ENGINES, catalogModelId],
    queryFn: () => getCarEngines(catalogModelId!),
    enabled: Boolean(catalogModelId) && enabled,
  });
}
