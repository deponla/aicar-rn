import { LegendList } from "@legendapp/list";
import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import {
  useActiveSessions,
  useRevokeSession,
} from "@/query-hooks/useSession";
import { useAuthStore } from "@/store/useAuth";
import { Session, SessionPlatform } from "@/types/session";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/tr";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);
dayjs.locale("tr");

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

function getPlatformLabel(platform: SessionPlatform): string {
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
      return "Bilinmiyor";
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
  const lastActive = dayjs(session.lastActiveAt).fromNow();
  const cardStyle = useMemo(
    () => [
      styles.sessionCard,
      {
        backgroundColor: tokens.bgSurface,
        borderColor: session.isCurrent
          ? `${Colors.primary}40`
          : tokens.borderDefault,
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
              {session.deviceName || getPlatformLabel(session.platform)}
            </Text>
            {session.isCurrent ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Bu cihaz</Text>
              </View>
            ) : null}
          </View>
          <Text style={sessionMetaStyle} numberOfLines={1}>
            {getPlatformLabel(session.platform)}
            {session.location ? ` · ${session.location}` : ""}
          </Text>
          <Text style={sessionMetaStyle}>Son aktiflik: {lastActive}</Text>
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
              <Text style={revokeButtonTextStyle}>Oturumu kapat</Text>
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
        "Oturumu kapat",
        "Bu cihazdaki oturum sonlandırılacak. Devam etmek istiyor musunuz?",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Oturumu Kapat",
            style: "destructive",
            onPress: async () => {
              try {
                await revokeSession.mutateAsync(id);
                notify({ type: "success", title: "Oturum kapatıldı" });
              } catch {
                notify({
                  type: "error",
                  title: "Oturum kapatılamadı",
                  message: "Lütfen tekrar deneyin.",
                });
              }
            },
          },
        ],
      );
    },
    [notify, revokeSession],
  );

  const handleRevokeAll = useCallback(() => {
    if (otherSessions.length === 0) {
      notify({ type: "info", title: "Başka aktif oturum yok" });
      return;
    }

    Alert.alert(
      "Tüm oturumları kapat",
      `Bu cihaz hariç ${otherSessions.length} oturum sonlandırılacak. Devam etmek istiyor musunuz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Tümünü Kapat",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                otherSessions.map((session) => revokeSession.mutateAsync(session.id)),
              );
              notify({
                type: "success",
                title: "Tüm oturumlar kapatıldı",
              });
            } catch {
              notify({
                type: "error",
                title: "Bazı oturumlar kapatılamadı",
                message: "Lütfen sayfayı yenileyip tekrar deneyin.",
              });
            }
          },
        },
      ],
    );
  }, [notify, otherSessions, revokeSession]);

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
        <Text style={styles.infoText}>
          Hesabınızda aktif olan tüm oturumları buradan görüntüleyebilir ve
          yönetebilirsiniz.
        </Text>
      </View>
    ),
    [],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <MaterialIcons name="devices" size={48} color="#C7C7CC" />
        <Text style={styles.emptyText}>Aktif oturum bulunamadı</Text>
      </View>
    ),
    [],
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
            <MaterialIcons name="logout" size={18} color="#FFFFFF" />
            <Text style={styles.revokeAllButtonText}>
              Diğer Tüm Oturumları Kapat ({otherSessionCount})
            </Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.footerSpacing} />
      </>
    ),
    [handleRevokeAll, otherSessionCount, revokeSession.isPending],
  );

  return (
    <ScreenContainer
      title="Aktif Oturumlar"
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
          <Text style={styles.errorTitle}>Oturumlar yüklenemedi</Text>
          <Text style={styles.emptySubtext}>
            {error instanceof Error
              ? error.message
              : "Lütfen sayfayı yenileyip tekrar deneyin."}
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
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  infoText: {
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
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
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: tokens.successBg,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: tokens.successText,
  },
  sessionMeta: {
    fontSize: 13,
  },
  sessionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 56,
  },
  sessionDetailText: {
    fontSize: 12,
  },
  revokeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 2,
  },
  revokeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  revokeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: tokens.danger,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  revokeAllButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
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
    fontSize: 15,
    color: "#8E8E93",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8E8E93",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
