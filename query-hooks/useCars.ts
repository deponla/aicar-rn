import { deleteCar } from "@/api/delete";
import { getCar, getCars } from "@/api/get";
import { patchCar } from "@/api/patch";
import {
  postCarUploadUrl,
  postConfirmCarPhoto,
  postCreateCar,
} from "@/api/post";
import {
  CarQuery,
  ConfirmCarPhotoRequest,
  CreateCarRequest,
  UpdateCarRequest,
} from "@/types/car";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

enum CarQueryKeys {
  CARS = "cars",
  CAR = "car",
}

export const useGetCars = (
  filters?: CarQuery,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [CarQueryKeys.CARS, filters],
    queryFn: () => getCars(filters),
    enabled,
  });
};

export const useGetCar = (id: string, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [CarQueryKeys.CAR, id],
    queryFn: () => getCar(id),
    enabled,
  });
};

export const useCreateCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCarRequest) => postCreateCar(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CarQueryKeys.CARS] });
    },
  });
};

export const useUpdateCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCarRequest }) =>
      patchCar(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CarQueryKeys.CARS] });
    },
  });
};

export const useDeleteCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CarQueryKeys.CARS] });
    },
  });
};

export const useCarUploadUrl = () => {
  return useMutation({
    mutationFn: postCarUploadUrl,
  });
};

export const useConfirmCarPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmCarPhotoRequest) =>
      postConfirmCarPhoto(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CarQueryKeys.CARS] });
      queryClient.invalidateQueries({
        queryKey: [CarQueryKeys.CAR, variables.carId],
      });
    },
  });
};
