import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { normalizeLanguage } from "@/i18n";
import { useGetNotifications } from "@/query-hooks/useNotifications";
import {
  Notification as AppNotification,
  NotificationType,
} from "@/types/notification";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TYPE_ICONS: Record<
  NotificationType,
  { icon: keyof typeof MaterialIcons.glyphMap; color: string }
> = {
  [NotificationType.GENERAL]: {
    icon: "notifications",
    color: tokens.info,
  },
  [NotificationType.PERSONAL]: {
    icon: "person",
    color: Colors.primary,
  },
  [NotificationType.ALERT]: {
    icon: "warning",
    color: tokens.warning,
  },
};

function formatNotificationDate(dateString: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

function NotificationCard({
  item,
  locale,
}: {
  item: AppNotification;
  locale: string;
}) {
  const meta = TYPE_ICONS[item.type] ?? TYPE_ICONS[NotificationType.GENERAL];

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${meta.color}15` }]}>
        <MaterialIcons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.cardDate}>
          {formatNotificationDate(item.createdAt, locale)}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const { data, isLoading, refetch } = useGetNotifications({
    limit: 50,
    sort: "createdAt:desc",
  });

  const notifications = data?.results ?? [];

  return (
    <ScreenContainer
      title={t("notifications.title")}
      showBackButton
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {isLoading && data === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : notifications.length > 0 ? (
        <View style={styles.list}>
          {notifications.map((item) => (
            <NotificationCard key={item.id} item={item} locale={locale} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="notifications-none"
            size={64}
            color={tokens.textPlaceholder}
          />
          <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
          <Text style={styles.emptyMessage}>
            {t("notifications.emptyMessage")}
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  list: {
    gap: 10,
    paddingTop: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: tokens.bgSurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: tokens.textPrimary,
  },
  cardBody: {
    fontSize: 13,
    color: tokens.textSecondary,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 11,
    color: tokens.textTertiary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: tokens.textTertiary,
  },
});
