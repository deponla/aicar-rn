import { ApiRequestError, isRetryableApiRequestError } from "@/api/config";
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
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const TOKEN_REFRESH_RETRY_DELAY_MS = 15_000;
const TOKEN_REFRESH_MAX_RETRY_DELAY_MS = 60_000;

export default function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t } = useTranslation();
  const authStatus = useAuthStore((state) => state.status);
  const authUser = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const lastRegisteredAccessToken = useRef<string | null>(null);
  const refreshRetryTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const logAuthRefreshFailure = useCallback(
    (context: string, error: unknown) => {
      if (isRetryableApiRequestError(error)) {
        console.warn(`${context}: ${error.message}`, {
          requestErrorCode: error.requestErrorCode,
          statusCode: error.statusCode,
        });
        return;
      }

      console.error(context, error);
    },
    [],
  );

  const persistAndLogin = useCallback(
    async (session: UserResponseData) => {
      try {
        await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(session));
      } catch (error) {
        console.error("Failed to persist refreshed session:", error);
      }
      login(session);
    },
    [login],
  );

  const scheduleRefreshRetry = useCallback(
    function scheduleRefreshRetry(refreshToken: string, attempt = 1) {
      if (refreshRetryTimeout.current) {
        clearTimeout(refreshRetryTimeout.current);
      }

      const retryDelay = Math.min(
        TOKEN_REFRESH_RETRY_DELAY_MS * 2 ** (attempt - 1),
        TOKEN_REFRESH_MAX_RETRY_DELAY_MS,
      );

      refreshRetryTimeout.current = setTimeout(() => {
        refreshRetryTimeout.current = null;

        const currentRefreshToken =
          useAuthStore.getState().user?.refreshToken.token;

        if (currentRefreshToken !== refreshToken) {
          return;
        }

        postRefreshToken({ token: refreshToken })
          .then((data) => persistAndLogin(data))
          .catch((error) => {
            logAuthRefreshFailure("Token refresh retry failed", error);

            if (isRetryableApiRequestError(error)) {
              scheduleRefreshRetry(refreshToken, attempt + 1);
              return;
            }

            void clearLocalAuthState();
          });
      }, retryDelay);
    },
    [logAuthRefreshFailure, persistAndLogin],
  );

  useEffect(() => {
    registerUnauthorizedHandler(() => clearLocalAuthState());

    return () => {
      clearUnauthorizedHandler();
      if (refreshRetryTimeout.current) {
        clearTimeout(refreshRetryTimeout.current);
      }
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
          try {
            const data = await postRefreshToken({
              token: parsedResult.refreshToken.token,
            });
            await persistAndLogin(data);
          } catch (error) {
            logAuthRefreshFailure("Token refresh failed during init", error);

            if (isRetryableApiRequestError(error)) {
              login(parsedResult);
              scheduleRefreshRetry(parsedResult.refreshToken.token);
              return;
            }

            void clearLocalAuthState();
          }
        } else if (accessTokenExpires < nowTime) {
          clearLocalAuthState();
        } else {
          getMe({ token: parsedResult.accessToken.token })
            .then((response) => {
              login({
                ...parsedResult,
                user: response.user,
              });
            })
            .catch((error) => {
              if (
                error instanceof ApiRequestError &&
                !isUnauthorizedStatus(error.statusCode)
              ) {
                logAuthRefreshFailure("getMe verification skipped", error);
                login(parsedResult);
                return;
              }

              console.error("getMe verification failed:", error);
              clearLocalAuthState();
            });
        }
      } else {
        clearLocalAuthState();
      }
    }
    void loadAuthStore();
  }, [logAuthRefreshFailure, login, persistAndLogin, scheduleRefreshRetry]);

  useEffect(() => {
    const accessToken = authUser?.accessToken.token;

    if (authStatus !== AuthStatusEnum.LOGGED_IN || !accessToken) {
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
  }, [authStatus, authUser?.accessToken.token]);

  useEffect(() => {
    if (authStatus !== AuthStatusEnum.LOGGED_IN) return;

    const FIVE_MINUTES = 5 * 60 * 1000;
    const CHECK_INTERVAL = 60 * 1000; // Her dakika kontrol et

    const interval = setInterval(async () => {
      if (authUser) {
        const nowTime = Date.now();
        const accessTokenExpires = new Date(
          authUser.accessToken.expires,
        ).getTime();
        const timeUntilExpiry = accessTokenExpires - nowTime;

        // Token'ın bitmesine 5 dakika veya daha az kaldıysa yenile
        if (timeUntilExpiry > 0 && timeUntilExpiry <= FIVE_MINUTES) {
          postRefreshToken({ token: authUser.refreshToken.token })
            .then(async (data) => {
              try {
                await SecureStore.setItemAsync(
                  SECURE_STORE_KEY,
                  JSON.stringify(data),
                );
              } catch (error) {
                console.error("Failed to persist refreshed session:", error);
              }
              login(data);
            })
            .catch((error) => {
              if (isRetryableApiRequestError(error)) {
                logAuthRefreshFailure("Proactive token refresh failed", error);
                scheduleRefreshRetry(authUser.refreshToken.token);
                return;
              }

              console.error("Proactive token refresh failed:", error);
              void clearLocalAuthState();
            });
        }
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [
    authStatus,
    authUser,
    login,
    logAuthRefreshFailure,
    scheduleRefreshRetry,
  ]);

  if (authStatus === AuthStatusEnum.LOADING) {
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
