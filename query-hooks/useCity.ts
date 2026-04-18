import { useQuery } from "@tanstack/react-query";
import {
  getDistrictById,
  getDistricts,
  getNeighborhoodById,
  getNeighborhoods,
  getProvinceById,
  getProvinces,
} from "../api/get";
import type {
  DistrictQueryParameters,
  NeighborhoodQueryParameters,
  ProvinceQueryParameters,
} from "../types/city";

enum CityQueryKeys {
  PROVINCES = "provinces",
  PROVINCE = "province",
  DISTRICTS = "districts",
  DISTRICT = "district",
  NEIGHBORHOODS = "neighborhoods",
  NEIGHBORHOOD = "neighborhood",
}

export const useGetProvinces = ({
  filters,
  enabled = true,
}: {
  filters?: ProvinceQueryParameters;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [CityQueryKeys.PROVINCES, filters],
    queryFn: () => getProvinces({ filters }),
    enabled,
  });
};

export const useGetProvinceById = ({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [CityQueryKeys.PROVINCE, id],
    queryFn: () => getProvinceById({ id }),
    enabled: enabled && !!id,
  });
};

export const useGetDistricts = ({
  filters,
  enabled = true,
}: {
  filters?: DistrictQueryParameters;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [CityQueryKeys.DISTRICTS, filters],
    queryFn: () => getDistricts({ filters }),
    enabled,
  });
};

export const useGetDistrictById = ({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [CityQueryKeys.DISTRICT, id],
    queryFn: () => getDistrictById({ id }),
    enabled: enabled && !!id,
  });
};

export const useGetNeighborhoods = ({
  filters,
  enabled = true,
}: {
  filters?: NeighborhoodQueryParameters;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [CityQueryKeys.NEIGHBORHOODS, filters],
    queryFn: () => getNeighborhoods({ filters }),
    enabled,
  });
};

export const useGetNeighborhoodById = ({
  id,
  enabled = true,
}: {
  id?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [CityQueryKeys.NEIGHBORHOOD, id],
    queryFn: () => getNeighborhoodById({ id }),
    enabled: enabled && !!id,
  });
};
