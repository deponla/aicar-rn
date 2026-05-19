import { getCarReminder, getCarReminders } from "@/api/get";
import { patchCarReminder } from "@/api/patch";
import { postCompleteCarReminder, postCreateCarReminder } from "@/api/post";
import {
  CarReminderQuery,
  CompleteCarReminderRequest,
  CreateCarReminderRequest,
  UpdateCarReminderRequest,
} from "@/types/car-reminder";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum CarReminderQueryKeys {
  REMINDERS = "car-reminders",
  REMINDER = "car-reminder",
}

export const useGetCarReminders = (
  filters?: CarReminderQuery,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  return useQuery({
    queryKey: [CarReminderQueryKeys.REMINDERS, filters],
    queryFn: () => getCarReminders(filters),
    enabled,
  });
};

export const useGetCarReminder = (id: string, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [CarReminderQueryKeys.REMINDER, id],
    queryFn: () => getCarReminder(id),
    enabled: enabled && !!id,
  });
};

export const useCreateCarReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCarReminderRequest) =>
      postCreateCarReminder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CarReminderQueryKeys.REMINDERS],
      });
    },
  });
};

export const useUpdateCarReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCarReminderRequest;
    }) => patchCarReminder(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CarReminderQueryKeys.REMINDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [CarReminderQueryKeys.REMINDER, variables.id],
      });
    },
  });
};

export const useCompleteCarReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CompleteCarReminderRequest;
    }) => postCompleteCarReminder(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CarReminderQueryKeys.REMINDERS],
      });
      queryClient.invalidateQueries({
        queryKey: [CarReminderQueryKeys.REMINDER, variables.id],
      });
    },
  });
};
