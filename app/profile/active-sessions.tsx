import { LegendList } from "@legendapp/list";
import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import {
  useActiveSessions,
  useRevokeSession,
} from "@/query-hooks/useSession";
import { useAuthStore } from "@/store/useAuth";
import { Session, SessionPlatform } from "@/types/session";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import "dayjs/locale/de";
import "dayjs/locale/en";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/tr";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);

function resolveDayjsLocale(language?: string): string {
  if (!language) return "en";
  if (language.startsWith("tr")) return "tr";
  if (language.startsWith("de")) return "de";
  return "en";
}

function getPlatformIcon(
  platform: SessionPlatform,
): keyof typeof MaterialIcons.glyphMap {
  switch (platform) {
    case "IOS":
      return "phone-iphone";
    case "ANDROID":
      return "phone-android";
    case "WEB":
      return "language";
    case "WINDOWS":
      return "desktop-windows";
    case "MACOS":
      return "laptop-mac";
    case "LINUX":
      return "computer";
    default:
      return "devices";
  }
}

function getPlatformLabel(platform: SessionPlatform, unknownLabel: string): string {
  switch (platform) {
    case "IOS":
      return "iOS";
    case "ANDROID":
      return "Android";
    case "WEB":
      return "Web";
    case "WINDOWS":
      return "Windows";
    case "MACOS":
      return "macOS";
    case "LINUX":
      return "Linux";
    default:
      return unknownLabel;
  }
}

const SessionCard = React.memo(function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: Session;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  const { t, i18n } = useTranslation();
  const unknownLabel = t("activeSessionsScreen.unknownPlatform");
  const lastActive = dayjs(session.lastActiveAt)
    .locale(resolveDayjsLocale(i18n.language))
    .fromNow();
  const cardStyle = useMemo(
    () => [
      styles.sessionCard,
      {
        backgroundColor: tokens.surfaceContainerLowest,
        borderColor: session.isCurrent
          ? `${Colors.primary}40`
          : tokens.borderSubtle,
      },
    ],
    [session.isCurrent],
  );
  const iconCircleStyle = useMemo(
    () => [
      styles.iconCircle,
      {
        backgroundColor: session.isCurrent ? tokens.primaryLight : tokens.bgSubtle,
      },
    ],
    [session.isCurrent],
  );
  const deviceNameStyle = useMemo(
    () => [styles.deviceName, { color: tokens.textPrimary }],
    [],
  );
  const sessionMetaStyle = useMemo(
    () => [styles.sessionMeta, { color: tokens.textTertiary }],
    [],
  );
  const detailTextStyle = useMemo(
    () => [styles.sessionDetailText, { color: tokens.textTertiary }],
    [],
  );
  const revokeButtonStyle = useMemo(
    () => [styles.revokeButton, { borderColor: `${tokens.danger}40` }],
    [],
  );
  const revokeButtonTextStyle = useMemo(
    () => [styles.revokeButtonText, { color: tokens.dangerText }],
    [],
  );

  return (
    <View style={cardStyle}>
      <View style={styles.sessionHeader}>
        <View style={iconCircleStyle}>
          <MaterialIcons
            name={getPlatformIcon(session.platform)}
            size={22}
            color={session.isCurrent ? Colors.primary : tokens.textSecondary}
          />
        </View>
        <View style={styles.sessionInfo}>
          <View style={styles.sessionTitleRow}>
            <Text style={deviceNameStyle} numberOfLines={1}>
              {session.deviceName || getPlatformLabel(session.platform, unknownLabel)}
            </Text>
            {session.isCurrent ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>{t("activeSessionsScreen.currentDevice")}</Text>
              </View>
            ) : null}
          </View>
          <Text style={sessionMetaStyle} numberOfLines={1}>
            {getPlatformLabel(session.platform, unknownLabel)}
            {session.location ? ` · ${session.location}` : ""}
          </Text>
          <Text style={sessionMetaStyle}>
            {t("activeSessionsScreen.lastActive")}: {lastActive}
          </Text>
        </View>
      </View>

      {session.ipAddress ? (
        <View style={styles.sessionDetailRow}>
          <MaterialIcons
            name="wifi"
            size={14}
            color={tokens.textPlaceholder}
          />
          <Text style={detailTextStyle}>{session.ipAddress}</Text>
        </View>
      ) : null}

      {!session.isCurrent ? (
        <TouchableOpacity
          style={revokeButtonStyle}
          onPress={() => onRevoke(session.id)}
          disabled={isRevoking}
          activeOpacity={0.7}
        >
          {isRevoking ? (
            <ActivityIndicator size="small" color={tokens.dangerText} />
          ) : (
            <>
              <MaterialIcons name="logout" size={16} color={tokens.dangerText} />
              <Text style={revokeButtonTextStyle}>{t("activeSessionsScreen.revokeButton")}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

export default function ActiveSessionsScreen() {
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const { notify } = useNotification();
  const { data: sessions, error, isError, isLoading, refetch } =
    useActiveSessions();
  const revokeSession = useRevokeSession();
  const currentSessionId = authStore.user?.sessionId;

  const normalizedSessions = useMemo(
    () =>
      (sessions ?? []).map((session) => ({
        ...session,
        isCurrent: Boolean(session.isCurrent) || session.id === currentSessionId,
      })),
    [sessions, currentSessionId],
  );

  const otherSessions = useMemo(
    () => normalizedSessions.filter((session) => !session.isCurrent),
    [normalizedSessions],
  );
  const otherSessionCount = otherSessions.length;

  const handleRevoke = useCallback(
    (id: string) => {
      Alert.alert(
        t("activeSessionsScreen.confirmTitle"),
        t("activeSessionsScreen.confirmMessage"),
        [
          { text: t("activeSessionsScreen.cancel"), style: "cancel" },
          {
            text: t("activeSessionsScreen.confirmAction"),
            style: "destructive",
            onPress: async () => {
              try {
                await revokeSession.mutateAsync(id);
                notify({ type: "success", title: t("activeSessionsScreen.revokeSuccess") });
              } catch {
                notify({
                  type: "error",
                  title: t("activeSessionsScreen.revokeErrorTitle"),
                  message: t("activeSessionsScreen.revokeErrorMessage"),
                });
              }
            },
          },
        ],
      );
    },
    [notify, revokeSession, t],
  );

  const handleRevokeAll = useCallback(() => {
    if (otherSessions.length === 0) {
      notify({ type: "info", title: t("activeSessionsScreen.noOtherSessions") });
      return;
    }

    Alert.alert(
      t("activeSessionsScreen.revokeAllTitle"),
      t("activeSessionsScreen.revokeAllMessage", { count: otherSessions.length }),
      [
        { text: t("activeSessionsScreen.cancel"), style: "cancel" },
        {
          text: t("activeSessionsScreen.revokeAllAction"),
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                otherSessions.map((session) => revokeSession.mutateAsync(session.id)),
              );
              notify({
                type: "success",
                title: t("activeSessionsScreen.revokeAllSuccess"),
              });
            } catch {
              notify({
                type: "error",
                title: t("activeSessionsScreen.revokeAllErrorTitle"),
                message: t("activeSessionsScreen.revokeAllErrorMessage"),
              });
            }
          },
        },
      ],
    );
  }, [notify, otherSessions, revokeSession, t]);

  const keyExtractor = useCallback((item: Session) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Session }) => (
      <SessionCard
        session={item}
        onRevoke={handleRevoke}
        isRevoking={revokeSession.isPending}
      />
    ),
    [handleRevoke, revokeSession.isPending],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.infoCard}>
        <MaterialIcons name="security" size={20} color={tokens.infoText} />
        <Text style={styles.infoText}>{t("activeSessionsScreen.infoText")}</Text>
      </View>
    ),
    [t],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <MaterialIcons name="devices" size={48} color={tokens.textPlaceholder} />
        <Text style={styles.emptyText}>{t("activeSessionsScreen.emptyTitle")}</Text>
      </View>
    ),
    [t],
  );

  const listFooter = useMemo(
    () => (
      <>
        {otherSessionCount > 0 ? (
          <TouchableOpacity
            style={styles.revokeAllButton}
            onPress={handleRevokeAll}
            disabled={revokeSession.isPending}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={18} color={tokens.textInverse} />
            <Text style={styles.revokeAllButtonText}>
              {t("activeSessionsScreen.revokeOtherSessions", {
                count: otherSessionCount,
              })}
            </Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.footerSpacing} />
      </>
    ),
    [handleRevokeAll, otherSessionCount, revokeSession.isPending, t],
  );

  return (
    <ScreenContainer
      title={t("settings.activeSessions")}
      showBackButton
      scrollable={false}
      contentContainerStyle={styles.screenContent}
    >
      {isLoading && sessions === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="error-outline" size={48} color={tokens.dangerText} />
          <Text style={styles.errorTitle}>{t("activeSessionsScreen.loadErrorTitle")}</Text>
          <Text style={styles.emptySubtext}>
            {error instanceof Error
              ? error.message
              : t("activeSessionsScreen.loadErrorFallback")}
          </Text>
        </View>
      ) : (
        <LegendList
          data={normalizedSessions}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={152}
          recycleItems
          refreshing={isLoading}
          onRefresh={refetch}
          style={styles.listView}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={emptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: tokens.infoBg,
    borderRadius: 20,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "flex-start",
    ...ambientShadow,
  },
  infoText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
    color: tokens.infoText,
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  listView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  listSeparator: {
    height: 12,
  },
  sessionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...ambientShadow,
  },
  sessionHeader: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    flexShrink: 1,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: tokens.successBg,
  },
  currentBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: tokens.successText,
  },
  sessionMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  sessionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 56,
  },
  sessionDetailText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
  revokeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 10,
    marginTop: 2,
  },
  revokeButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  revokeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: tokens.danger,
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: 20,
  },
  revokeAllButtonText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textInverse,
    fontSize: 15,
  },
  footerSpacing: {
    height: 32,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: tokens.textTertiary,
  },
  errorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  emptySubtext: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.textTertiary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
