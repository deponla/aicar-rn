import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import { useDeleteAccount } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
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
            } catch (error: unknown) {
              notifyApiError({
                error,
                fallbackMessage: t("deleteAccount.retryLater"),
                notify,
                title: t("deleteAccount.deleteFailed"),
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
          <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
          <Text style={styles.emptyText}>{t("deleteAccount.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title={t("deleteAccount.title")} showBackButton>
      <View style={styles.warningCard}>
        <MaterialIcons name="warning-amber" size={36} color={tokens.danger} />
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
          placeholderTextColor={tokens.textPlaceholder}
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
          <ActivityIndicator color={tokens.textInverse} />
        ) : (
          <>
            <MaterialIcons name="delete-forever" size={20} color={tokens.textInverse} />
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
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: tokens.textTertiary,
  },
  warningCard: {
    backgroundColor: tokens.dangerBg,
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
    color: tokens.dangerText,
  },
  warningText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: tokens.dangerText,
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
  confirmationCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    gap: 10,
    marginBottom: 18,
    ...ambientShadow,
  },
  confirmationTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  confirmationText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    backgroundColor: tokens.surfaceContainerLow,
    paddingHorizontal: 14,
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: tokens.textPrimary,
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 9999,
    backgroundColor: tokens.danger,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontFamily: FontFamily.bold,
    color: tokens.textInverse,
    fontSize: 15,
  },
});
