import { ApiRequestError } from "@/api/config";
import { getMe } from "@/api/get";
import { postRefreshToken } from "@/api/post";
import {
  clearUnauthorizedHandler,
  isUnauthorizedStatus,
  registerUnauthorizedHandler,
} from "@/api/auth-session";
import { Colors } from "@/constants/theme";
import {
  clearLocalAuthState,
  SECURE_STORE_KEY,
  useAuthStore,
} from "@/store/useAuth";
import { registerDeviceAfterLogin } from "@/utils/deviceRegistration";
import { AuthStatusEnum, UserResponseData } from "@/types/auth";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const lastRegisteredAccessToken = useRef<string | null>(null);

  useEffect(() => {
    registerUnauthorizedHandler(() => clearLocalAuthState());

    return () => {
      clearUnauthorizedHandler();
    };
  }, []);

  useEffect(() => {
    async function loadAuthStore() {
      let parsedResult: UserResponseData | null = null;
      try {
        const result = await SecureStore.getItemAsync(SECURE_STORE_KEY);
        parsedResult = result
          ? (JSON.parse(result) as UserResponseData)
          : null;
      } catch (error) {
        console.error("Failed to read auth from SecureStore:", error);
        clearLocalAuthState();
        return;
      }

      if (parsedResult) {
        const nowTime = Date.now();

        const accessTokenExpires = new Date(
          parsedResult.accessToken.expires,
        ).getTime();
        const refreshTokenExpires = new Date(
          parsedResult.refreshToken.expires,
        ).getTime();
        const shouldRefreshSession =
          refreshTokenExpires >= nowTime &&
          (accessTokenExpires < nowTime || !parsedResult.sessionId);

        if (shouldRefreshSession) {
          postRefreshToken({ token: parsedResult.refreshToken.token })
            .then(async (data) => {
              try {
                await SecureStore.setItemAsync(
                  SECURE_STORE_KEY,
                  JSON.stringify(data),
                );
              } catch (error) {
                console.error("Failed to persist refreshed session:", error);
              }
              authStore.login(data);
            })
            .catch((error) => {
              console.error("Token refresh failed during init:", error);
              clearLocalAuthState();
            });
        } else if (accessTokenExpires < nowTime) {
          clearLocalAuthState();
        } else {
          getMe({ token: parsedResult.accessToken.token })
            .then((response) => {
              authStore.login({
                ...parsedResult,
                user: response.user,
              });
            })
            .catch((error) => {
              console.error("getMe verification failed:", error);
              if (
                error instanceof ApiRequestError &&
                !isUnauthorizedStatus(error.statusCode)
              ) {
                authStore.login(parsedResult);
                return;
              }

              clearLocalAuthState();
            });
        }
      } else {
        clearLocalAuthState();
      }
    }
    loadAuthStore();
  }, []);

  useEffect(() => {
    const accessToken = authStore.user?.accessToken.token;

    if (authStore.status !== AuthStatusEnum.LOGGED_IN || !accessToken) {
      lastRegisteredAccessToken.current = null;
      return;
    }

    if (lastRegisteredAccessToken.current === accessToken) {
      return;
    }

    lastRegisteredAccessToken.current = accessToken;
    registerDeviceAfterLogin().catch((error) => {
      console.error("Device registration failed:", error);
    });
  }, [authStore.status, authStore.user?.accessToken.token]);

  useEffect(() => {
    if (authStore.status !== AuthStatusEnum.LOGGED_IN) return;

    const FIVE_MINUTES = 5 * 60 * 1000;
    const CHECK_INTERVAL = 60 * 1000; // Her dakika kontrol et

    const interval = setInterval(async () => {
      if (authStore.user) {
        const nowTime = Date.now();
        const accessTokenExpires = new Date(
          authStore.user.accessToken.expires,
        ).getTime();
        const timeUntilExpiry = accessTokenExpires - nowTime;

        // Token'ın bitmesine 5 dakika veya daha az kaldıysa yenile
        if (timeUntilExpiry > 0 && timeUntilExpiry <= FIVE_MINUTES) {
          postRefreshToken({ token: authStore.user.refreshToken.token })
            .then(async (data) => {
              try {
                await SecureStore.setItemAsync(
                  SECURE_STORE_KEY,
                  JSON.stringify(data),
                );
              } catch (error) {
                console.error("Failed to persist refreshed session:", error);
              }
              authStore.login(data);
            })
            .catch((error) => {
              console.error("Proactive token refresh failed:", error);
              clearLocalAuthState();
            });
        }
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [authStore.status, authStore.user]);

  if (authStore.status === AuthStatusEnum.LOADING) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t("auth.loading")}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "500",
  },
});
