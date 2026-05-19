import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import { useFreezeAccount } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FreezeAccountScreen() {
    const { t } = useTranslation();
    const authStore = useAuthStore();
    const user = authStore.user?.user;
    const router = useRouter();
    const { notify } = useNotification();
    const freezeAccount = useFreezeAccount();

    const handleFreeze = () => {
        Alert.alert(
            t("freezeAccount.confirmTitle"),
            t("freezeAccount.confirmMessage"),
            [
                { text: t("freezeAccount.cancel"), style: "cancel" },
                {
                    text: t("freezeAccount.confirmAction"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await freezeAccount.mutateAsync();
                            await authStore.logout();
                            notify({
                                type: "success",
                                title: t("freezeAccount.successTitle"),
                                message: t("freezeAccount.successMessage"),
                            });
                            router.replace("/(tabs)/profile");
                        } catch (error: unknown) {
                            notify({
                                type: "error",
                                title: t("freezeAccount.errorTitle"),
                                message:
                                    (error instanceof Error ? error.message : undefined) ||
                                    t("freezeAccount.errorMessage"),
                            });
                        }
                    },
                },
            ],
        );
    };

    if (!user) {
        return (
            <ScreenContainer title={t("settings.freezeAccount")} showBackButton>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
                    <Text style={styles.emptyText}>{t("settings.noUser")}</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer title={t("settings.freezeAccount")} showBackButton>
            <View style={styles.warningCard}>
                <MaterialIcons name="pause-circle-outline" size={36} color={tokens.warningText} />
                <Text style={styles.warningTitle}>{t("freezeAccount.warningTitle")}</Text>
                <Text style={styles.warningText}>{t("freezeAccount.warningText")}</Text>
            </View>

            <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>{t("freezeAccount.accountTitle")}</Text>
                <Text style={styles.detailText}>{user.email}</Text>
                <Text style={styles.detailText}>
                    {user.name} {user.surname}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.freezeButton}
                onPress={handleFreeze}
                disabled={freezeAccount.isPending}
                activeOpacity={0.85}
            >
                {freezeAccount.isPending ? (
                    <ActivityIndicator color={tokens.textInverse} />
                ) : (
                    <>
                        <MaterialIcons name="pause-circle-outline" size={20} color={tokens.textInverse} />
                        <Text style={styles.freezeButtonText}>{t("freezeAccount.button")}</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
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
    warningCard: {
        backgroundColor: tokens.warningBg,
        borderRadius: 24,
        padding: 20,
        alignItems: "center",
        gap: 10,
        marginBottom: 18,
        marginTop: 12,
        ...ambientShadow,
    },
    warningTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 18,
        color: tokens.warningText,
    },
    warningText: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        color: tokens.warningText,
    },
    detailCard: {
        backgroundColor: tokens.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        gap: 8,
        marginBottom: 18,
        ...ambientShadow,
    },
    detailTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 16,
        color: tokens.textPrimary,
    },
    detailText: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        color: tokens.textSecondary,
    },
    freezeButton: {
        minHeight: 52,
        borderRadius: 9999,
        backgroundColor: tokens.warning,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    freezeButtonText: {
        fontFamily: FontFamily.bold,
        color: tokens.textInverse,
        fontSize: 15,
    },
});
