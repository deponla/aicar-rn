import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
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
            "Hesabınız geçici olarak dondurulacak, tüm oturumlarınız sonlandırılacak ve daha sonra e-posta ile şifrenizle yeniden açılabilecektir.",
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
                                message: "İstediğiniz zaman hesabınızı yeniden etkinleştirebilirsiniz.",
                            });
                            router.replace("/(tabs)/profile");
                        } catch (error: unknown) {
                            const err = error as { response?: { data?: { message?: string } } };
                            notify({
                                type: "error",
                                title: "Hesap dondurulamadı",
                                message:
                                    err?.response?.data?.message ||
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
                    <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
                    <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer title="Hesabı dondur" showBackButton>
            <View style={styles.warningCard}>
                <MaterialIcons name="pause-circle-outline" size={36} color="#92400E" />
                <Text style={styles.warningTitle}>Bu işlem geri alınabilir</Text>
                <Text style={styles.warningText}>
                    Hesabınız dondurulduğunda mevcut oturumlarınız kapanır ve korumalı
                    alanlara erişemezsiniz. Daha sonra hesabınızı yeniden açabilirsiniz.
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
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <MaterialIcons name="pause-circle-outline" size={20} color="#FFFFFF" />
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
        fontSize: 15,
        color: "#8E8E93",
    },
    warningCard: {
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        borderRadius: 18,
        padding: 20,
        alignItems: "center",
        gap: 10,
        marginBottom: 18,
        marginTop: 12,
    },
    warningTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#92400E",
    },
    warningText: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        color: "#78350F",
    },
    detailCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ECECEC",
        padding: 18,
        gap: 8,
        marginBottom: 18,
    },
    detailTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    detailText: {
        fontSize: 14,
        color: "#4B5563",
    },
    freezeButton: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: "#B45309",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    freezeButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
});
