import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { usePatchUsers, useSendEmailVerification } from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmailAddressScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const { notify } = useNotification();
  const { t } = useTranslation();
  const patchUser = usePatchUsers();
  const sendEmailVerification = useSendEmailVerification();
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  if (!user) {
    return (
      <ScreenContainer title={t("settings.emailAddress")} showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
          <Text style={styles.emptyText}>{t("settings.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isDirty = email.trim() !== user.email;

  const handleSaveEmail = async () => {
    try {
      const nextEmail = email.trim();
      await patchUser.mutateAsync({
        id: user.id,
        d: { email: nextEmail },
      });

      mergeAuthenticatedUser({
        email: nextEmail,
        emailVerified: false,
        emailVerifiedAt: null,
      });

      notify({
        type: "success",
        title: t("emailAddressScreen.updateSuccessTitle"),
        message: t("emailAddressScreen.updateSuccessMessage"),
      });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("emailAddressScreen.errorMessage"),
        notify,
        title: t("emailAddressScreen.updateErrorTitle"),
      });
    }
  };

  const handleSendVerification = async () => {
    try {
      const response = await sendEmailVerification.mutateAsync();
      notify({
        type: "success",
        title: t("emailAddressScreen.verificationSuccessTitle"),
        message: response.message,
      });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("emailAddressScreen.errorMessage"),
        notify,
        title: t("emailAddressScreen.verificationErrorTitle"),
      });
    }
  };

  return (
    <ScreenContainer title={t("settings.emailAddress")} showBackButton>
      <View style={styles.card}>
        <Text style={styles.title}>{t("emailAddressScreen.title")}</Text>
        <Text style={styles.subtitle}>{t("emailAddressScreen.subtitle")}</Text>

        <Text style={styles.label}>{t("emailAddressScreen.label")}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t("emailAddressScreen.placeholder")}
          placeholderTextColor={tokens.textPlaceholder}
        />

        <Text style={styles.statusText}>
          {t("emailAddressScreen.statusLabel")}: {" "}
          {user.emailVerified && !isDirty
            ? t("common.status.verified")
            : t("common.status.unverified")}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, !isDirty && styles.disabledButton]}
          onPress={handleSaveEmail}
          disabled={!isDirty || patchUser.isPending}
          activeOpacity={0.8}
        >
          {patchUser.isPending ? (
            <ActivityIndicator color={tokens.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>{t("emailAddressScreen.saveButton")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSendVerification}
          disabled={sendEmailVerification.isPending || isDirty}
          activeOpacity={0.8}
        >
          {sendEmailVerification.isPending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {t("emailAddressScreen.verificationButton")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    marginTop: 12,
    ...ambientShadow,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textPrimary,
    backgroundColor: tokens.surfaceContainerLow,
  },
  statusText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: tokens.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textInverse,
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    backgroundColor: tokens.surfaceContainerLowest,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.45,
  },
});
