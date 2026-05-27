import { useNotification } from "@/components/Notification";
import { profileFormStyles as styles } from "@/components/profileFormStyles";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { usePatchUsers, useSendEmailVerification } from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
    const frame = requestAnimationFrame(() => {
      setEmail(user?.email || "");
    });

    return () => {
      cancelAnimationFrame(frame);
    };
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

      await mergeAuthenticatedUser({
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
