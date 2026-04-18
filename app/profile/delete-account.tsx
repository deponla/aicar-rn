import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { useDeleteAccount } from "@/query-hooks/useUser";
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

export default function DeleteAccountScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const { notify } = useNotification();
  const deleteAccount = useDeleteAccount();

  const handleDelete = () => {
    Alert.alert(
      "Hesabı kapat",
      "Hesabınız kapatılacak ve oturumunuz sonlandırılacak. Bu işlemden sonra tekrar giriş yapamazsınız.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabı kapat",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              await authStore.logout();
              notify({
                type: "success",
                title: "Hesap kapatıldı",
              });
              router.replace("/(tabs)/profile");
            } catch (error: any) {
              notify({
                type: "error",
                title: "Hesap kapatılamadı",
                message:
                  error?.response?.data?.message ||
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
      <ScreenContainer title="Hesap iptali" showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Hesap iptali" showBackButton>
      <View style={styles.warningCard}>
        <MaterialIcons name="warning-amber" size={36} color="#DC2626" />
        <Text style={styles.warningTitle}>Bu işlem geri alınamaz</Text>
        <Text style={styles.warningText}>
          Hesabınız soft delete ile kapatılacak, tüm oturumlarınız
          sonlandırılacak ve korumalı ekranlara erişiminiz kesilecek.
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>Kapatılacak hesap</Text>
        <Text style={styles.detailText}>{user.email}</Text>
        <Text style={styles.detailText}>
          {user.name} {user.surname}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={deleteAccount.isPending}
        activeOpacity={0.85}
      >
        {deleteAccount.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Hesabımı kapat</Text>
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
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
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
    color: "#991B1B",
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#7F1D1D",
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
  deleteButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
