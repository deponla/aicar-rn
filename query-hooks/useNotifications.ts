import { getNotifications } from "@/api/get";
import { normalizeLanguage } from "@/i18n";
import { NotificationQuery } from "@/types/notification";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

enum NotificationQueryKeys {
  NOTIFICATIONS = "notifications",
}

export const useGetNotifications = (filters?: NotificationQuery) => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [NotificationQueryKeys.NOTIFICATIONS, filters, language],
    queryFn: () => getNotifications(filters),
  });
};
