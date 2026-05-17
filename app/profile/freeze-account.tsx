import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import { useFreezeAccount } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FreezeAccountScreen() {
    const authStore = useAuthStore();
    const user = authStore.user?.user;
    const router = useRouter();
    const { notify } = useNotification();
    const freezeAccount = useFreezeAccount();

    const handleFreeze = () => {
        Alert.alert(
            "Hesabı dondur",
            "Hesabınız geçici olarak dondurulacak ve tüm oturumlarınız sonlandırılacak. Daha sonra giriş yaptığınızda hesabınızı e-posta ve şifrenizle yeniden etkinleştirebilirsiniz.",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Hesabı dondur",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await freezeAccount.mutateAsync();
                            await authStore.logout();
                            notify({
                                type: "success",
                                title: "Hesap donduruldu",
                                message: "Tekrar giriş yaptığınızda hesabınızı yeniden etkinleştirebilirsiniz.",
                            });
                            router.replace("/(tabs)/profile");
                        } catch (error: unknown) {
                            notify({
                                type: "error",
                                title: "Hesap dondurulamadı",
                                message:
                                    (error instanceof Error ? error.message : undefined) ||
                                    "Lütfen daha sonra tekrar deneyin.",
                            });
                        }
                    },
                },
            ],
        );
    };

    if (!user) {
        return (
            <ScreenContainer title="Hesabı dondur" showBackButton>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
                    <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer title="Hesabı dondur" showBackButton>
            <View style={styles.warningCard}>
                <MaterialIcons name="pause-circle-outline" size={36} color={tokens.warningText} />
                <Text style={styles.warningTitle}>Bu işlem geri alınabilir</Text>
                <Text style={styles.warningText}>
                    Hesabınız dondurulduğunda mevcut oturumlarınız kapanır ve korumalı
                    alanlara erişemezsiniz. Bir sonraki girişinizde hesabınızı yeniden etkinleştirebilirsiniz.
                </Text>
            </View>

            <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>Dondurulacak hesap</Text>
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
                        <Text style={styles.freezeButtonText}>Hesabımı dondur</Text>
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
