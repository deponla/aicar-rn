import { getNotifications } from "@/api/get";
import { NotificationQuery } from "@/types/notification";
import { useQuery } from "@tanstack/react-query";

export enum NotificationQueryKeys {
  NOTIFICATIONS = "notifications",
}

export const useGetNotifications = (filters?: NotificationQuery) => {
  return useQuery({
    queryKey: [NotificationQueryKeys.NOTIFICATIONS, filters],
    queryFn: () => getNotifications(filters),
  });
};
