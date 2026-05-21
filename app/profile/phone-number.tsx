import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import {
  usePatchUsers,
  useSendSmsOtp,
  useVerifySmsOtp,
} from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { SmsOtpType } from "@/types/user";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function PhoneNumberScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const { notify } = useNotification();
  const { t } = useTranslation();
  const patchUser = usePatchUsers();
  const sendSmsOtp = useSendSmsOtp();
  const verifySmsOtp = useVerifySmsOtp();

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [savedPhone, setSavedPhone] = useState(user?.phone || "");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setPhone(user?.phone || "");
      setSavedPhone(user?.phone || "");
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [user?.phone]);

  if (!user) {
    return (
      <ScreenContainer title={t("phoneNumberScreen.screenTitle")} showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
          <Text style={styles.emptyText}>{t("settings.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isDirty = phone.trim() !== savedPhone;

  const handleSavePhone = async () => {
    try {
      await patchUser.mutateAsync({
        id: user.id,
        d: {
          phone: phone.trim(),
        },
      });

      const nextPhone = phone.trim();
      setSavedPhone(nextPhone);
      await mergeAuthenticatedUser({
        phone: nextPhone,
        isPhoneVerified: false,
      });

      notify({
        type: "success",
        title: t("phoneNumberScreen.notifications.updatedTitle"),
        message: t("phoneNumberScreen.notifications.updatedMessage"),
      });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("phoneNumberScreen.notifications.errorMessage"),
        notify,
        title: t("phoneNumberScreen.notifications.updateFailedTitle"),
      });
    }
  };

  const handleSendOtp = async () => {
    try {
      const response = await sendSmsOtp.mutateAsync({
        type: SmsOtpType.PHONE_VERIFICATION,
      });

      notify({
        type: "success",
        title: t("phoneNumberScreen.notifications.codeSentTitle"),
        message: response.message,
      });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("phoneNumberScreen.notifications.errorMessage"),
        notify,
        title: t("phoneNumberScreen.notifications.codeFailedTitle"),
      });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifySmsOtp.mutateAsync({
        otpCode: otpCode.trim(),
        type: SmsOtpType.PHONE_VERIFICATION,
      });

      await mergeAuthenticatedUser({
        phone: savedPhone,
        isPhoneVerified: true,
      });
      setOtpCode("");

      notify({
        type: "success",
        title: t("phoneNumberScreen.notifications.verifiedTitle"),
      });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("phoneNumberScreen.notifications.errorMessage"),
        notify,
        title: t("phoneNumberScreen.notifications.verifyFailedTitle"),
      });
    }
  };

  return (
    <ScreenContainer title={t("phoneNumberScreen.screenTitle")} showBackButton>
      <View style={styles.card}>
        <Text style={styles.title}>{t("phoneNumberScreen.title")}</Text>
        <Text style={styles.subtitle}>{t("phoneNumberScreen.subtitle")}</Text>

        <Text style={styles.label}>{t("phoneNumberScreen.label")}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder={t("phoneNumberScreen.placeholder")}
          placeholderTextColor={tokens.textPlaceholder}
        />

        <Text style={styles.statusText}>
          {t("phoneNumberScreen.statusLabel")}: {" "}
          {user.isPhoneVerified && !isDirty
            ? t("common.status.verified")
            : t("common.status.unverified")}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, !isDirty && styles.disabledButton]}
          onPress={handleSavePhone}
          disabled={!isDirty || patchUser.isPending}
          activeOpacity={0.8}
        >
          {patchUser.isPending ? (
            <ActivityIndicator color={tokens.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>{t("phoneNumberScreen.saveButton")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSendOtp}
          disabled={sendSmsOtp.isPending || isDirty}
          activeOpacity={0.8}
        >
          {sendSmsOtp.isPending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>{t("phoneNumberScreen.sendCodeButton")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t("phoneNumberScreen.verificationTitle")}</Text>
        <TextInput
          style={styles.input}
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          placeholder={t("phoneNumberScreen.codePlaceholder")}
          placeholderTextColor={tokens.textPlaceholder}
          maxLength={6}
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            otpCode.trim().length !== 6 && styles.disabledButton,
          ]}
          onPress={handleVerifyOtp}
          disabled={
            otpCode.trim().length !== 6 || verifySmsOtp.isPending || isDirty
          }
          activeOpacity={0.8}
        >
          {verifySmsOtp.isPending ? (
            <ActivityIndicator color={tokens.textInverse} />
          ) : (
            <Text style={styles.primaryButtonText}>{t("phoneNumberScreen.verifyButton")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Text style={styles.linkText}>{t("phoneNumberScreen.back")}</Text>
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
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    marginBottom: 18,
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
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    fontSize: 14,
  },
});
