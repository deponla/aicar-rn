import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { useDeleteAccount } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const { notify } = useNotification();
  const deleteAccount = useDeleteAccount();
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const normalizedConfirmationEmail = confirmationEmail.trim().toLowerCase();
  const normalizedUserEmail = user?.email.trim().toLowerCase() ?? "";
  const canSubmit = normalizedConfirmationEmail === normalizedUserEmail;

  const handleDelete = () => {
    if (!user || !canSubmit) {
      return;
    }

    Alert.alert(
      t("deleteAccount.confirmTitle"),
      t("deleteAccount.confirmMessage"),
      [
        { text: t("deleteAccount.cancel"), style: "cancel" },
        {
          text: t("deleteAccount.confirmAction"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync({
                confirmationEmail: confirmationEmail.trim(),
              });
              await authStore.logout();
              notify({
                type: "success",
                title: t("deleteAccount.deleted"),
              });
              router.replace("/(tabs)/profile");
            } catch (error: any) {
              notify({
                type: "error",
                title: t("deleteAccount.deleteFailed"),
                message:
                  error?.response?.data?.message ||
                  t("deleteAccount.retryLater"),
              });
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <ScreenContainer title={t("deleteAccount.title")} showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>{t("deleteAccount.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={t("deleteAccount.title")} showBackButton>
      <View style={styles.warningCard}>
        <MaterialIcons name="warning-amber" size={36} color="#DC2626" />
        <Text style={styles.warningTitle}>{t("deleteAccount.warningTitle")}</Text>
        <Text style={styles.warningText}>
          {t("deleteAccount.warningText")}
        </Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>{t("deleteAccount.accountTitle")}</Text>
        <Text style={styles.detailText}>{user.email}</Text>
        <Text style={styles.detailText}>
          {user.name} {user.surname}
        </Text>
      </View>

      <View style={styles.confirmationCard}>
        <Text style={styles.confirmationTitle}>{t("deleteAccount.emailTitle")}</Text>
        <Text style={styles.confirmationText}>
          {t("deleteAccount.emailDescription")}
        </Text>
        <TextInput
          style={styles.input}
          value={confirmationEmail}
          onChangeText={setConfirmationEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={user.email}
          placeholderTextColor="#C7C7CC"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          (!canSubmit || deleteAccount.isPending) && styles.disabledButton,
        ]}
        onPress={handleDelete}
        disabled={!canSubmit || deleteAccount.isPending}
        activeOpacity={0.85}
      >
        {deleteAccount.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="delete-forever" size={20} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>{t("deleteAccount.button")}</Text>
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
  confirmationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 18,
    gap: 10,
    marginBottom: 18,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  confirmationText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1C1C1E",
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
  disabledButton: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
