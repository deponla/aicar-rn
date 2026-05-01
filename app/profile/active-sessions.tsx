import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import {
    useActiveSessions,
    useRevokeSession,
} from "@/query-hooks/useSession";
import { Session, SessionPlatform } from "@/types/session";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/tr";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
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

function SessionCard({
    session,
    onRevoke,
    isRevoking,
}: {
    session: Session;
    onRevoke: (id: string) => void;
    isRevoking: boolean;
}) {
    const t = tokens;
    const lastActive = dayjs(session.lastActiveAt).fromNow();

    return (
        <View
            style={[
                styles.sessionCard,
                {
                    backgroundColor: t.bgSurface,
                    borderColor: session.isCurrent
                        ? Colors.primary + "40"
                        : t.borderDefault,
                },
            ]}
        >
            <View style={styles.sessionHeader}>
                <View
                    style={[
                        styles.iconCircle,
                        {
                            backgroundColor: session.isCurrent
                                ? t.primaryLight
                                : t.bgSubtle,
                        },
                    ]}
                >
                    <MaterialIcons
                        name={getPlatformIcon(session.platform)}
                        size={22}
                        color={session.isCurrent ? Colors.primary : t.textSecondary}
                    />
                </View>
                <View style={styles.sessionInfo}>
                    <View style={styles.sessionTitleRow}>
                        <Text
                            style={[styles.deviceName, { color: t.textPrimary }]}
                            numberOfLines={1}
                        >
                            {session.deviceName || getPlatformLabel(session.platform)}
                        </Text>
                        {session.isCurrent && (
                            <View
                                style={[
                                    styles.currentBadge,
                                    { backgroundColor: t.successBg },
                                ]}
                            >
                                <Text
                                    style={[styles.currentBadgeText, { color: t.successText }]}
                                >
                                    Bu cihaz
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text
                        style={[styles.sessionMeta, { color: t.textTertiary }]}
                        numberOfLines={1}
                    >
                        {getPlatformLabel(session.platform)}
                        {session.location ? ` · ${session.location}` : ""}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: t.textTertiary }]}>
                        Son aktiflik: {lastActive}
                    </Text>
                </View>
            </View>

            {session.ipAddress && (
                <View style={styles.sessionDetailRow}>
                    <MaterialIcons name="wifi" size={14} color={t.textPlaceholder} />
                    <Text style={[styles.sessionDetailText, { color: t.textTertiary }]}>
                        {session.ipAddress}
                    </Text>
                </View>
            )}

            {!session.isCurrent && (
                <TouchableOpacity
                    style={[
                        styles.revokeButton,
                        { borderColor: t.danger + "40" },
                    ]}
                    onPress={() => onRevoke(session.id)}
                    disabled={isRevoking}
                    activeOpacity={0.7}
                >
                    {isRevoking ? (
                        <ActivityIndicator size="small" color={t.dangerText} />
                    ) : (
                        <>
                            <MaterialIcons name="logout" size={16} color={t.dangerText} />
                            <Text style={[styles.revokeButtonText, { color: t.dangerText }]}>
                                Oturumu kapat
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function ActiveSessionsScreen() {
    const t = tokens;
    const { notify } = useNotification();
    const { data: sessions, isLoading, refetch } = useActiveSessions();
    const revokeSession = useRevokeSession();

    const handleRevoke = (id: string) => {
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
    };

    const handleRevokeAll = () => {
        const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];
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
                                otherSessions.map((s) => revokeSession.mutateAsync(s.id)),
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
    };

    const otherSessionCount =
        sessions?.filter((s) => !s.isCurrent).length || 0;

    return (
        <ScreenContainer
            title="Aktif Oturumlar"
            showBackButton
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
        >
            <View style={styles.infoCard}>
                <MaterialIcons name="security" size={20} color={t.infoText} />
                <Text style={[styles.infoText, { color: t.infoText }]}>
                    Hesabınızda aktif olan tüm oturumları buradan görüntüleyebilir ve
                    yönetebilirsiniz.
                </Text>
            </View>

            {isLoading && !sessions ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : sessions && sessions.length > 0 ? (
                <View style={styles.sessionsList}>
                    {sessions.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            onRevoke={handleRevoke}
                            isRevoking={revokeSession.isPending}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <MaterialIcons name="devices" size={48} color="#C7C7CC" />
                    <Text style={styles.emptyText}>Aktif oturum bulunamadı</Text>
                </View>
            )}

            {otherSessionCount > 0 && (
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
            )}

            <View style={{ height: 32 }} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    infoCard: {
        flexDirection: "row",
        gap: 10,
        backgroundColor: tokens.infoBg,
        borderRadius: 14,
        padding: 14,
        marginTop: 8,
        alignItems: "flex-start",
    },
    infoText: {
        fontSize: 13,
        lineHeight: 19,
        flex: 1,
    },
    loadingContainer: {
        paddingTop: 80,
        alignItems: "center",
    },
    sessionsList: {
        gap: 12,
        marginTop: 16,
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
    },
    currentBadgeText: {
        fontSize: 11,
        fontWeight: "600",
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
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: "#8E8E93",
    },
});
