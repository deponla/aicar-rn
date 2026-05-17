import {
  AUTH_CALLBACK_ACTIONS,
} from "@/utils/parseSessionFromUrl";
import { startAuthSession } from "@/utils/authSession";
import * as SecureStore from "expo-secure-store";
import { tokens, FontFamily } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "./ScreenContainer";
import { SECURE_STORE_KEY, useAuthStore } from "@/store/useAuth";

interface LoginRequiredProps {
  readonly pageTitle: string;
  readonly title: string;
  readonly description: string;
}

export default function LoginRequired({
  pageTitle,
  title,
  description,
}: LoginRequiredProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const authStore = useAuthStore();

  const handleLogin = async () => {
    try {
      const result = await startAuthSession(
        "login",
        t("profileScreen.errors.frontendUrlMissing"),
      );

      if (result.type === "opened-in-browser" || result.type === "cancelled") {
        return;
      }

      if (result.type === "invalid-callback") {
        Alert.alert(
          t("profileScreen.authFailedTitle"),
          t("auth.callback.unreadableSession"),
        );
        return;
      }

      if (result.authCallback.type === "intent") {
        if (result.authCallback.action === AUTH_CALLBACK_ACTIONS.REACTIVATE_ACCOUNT) {
          router.push({
            pathname: "/auth/reactivate",
            params: {
              email: result.authCallback.email,
              reason: result.authCallback.reason,
            },
          });
          return;
        }

        Alert.alert(
          t("profileScreen.authFailedTitle"),
          t("profileScreen.errors.additionalActionRequired"),
        );
        return;
      }

      await SecureStore.setItemAsync(
        SECURE_STORE_KEY,
        JSON.stringify(result.authCallback.session),
      );
      authStore.login(result.authCallback.session);
    } catch (error) {
      Alert.alert(
        t("profileScreen.loginStartFailed"),
        error instanceof Error
          ? error.message
          : t("profileScreen.errors.browserSessionFailed"),
      );
    }
  };

  return (
    <ScreenContainer title={pageTitle}>
      {/* Login Card */}
      <View style={styles.loginCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => {
            void handleLogin();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>{t("tabs.signIn")}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loginCard: {
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.semiBold,
    color: tokens.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: tokens.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: tokens.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
