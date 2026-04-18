import { getMe } from "@/api/get";
import { postRefreshToken } from "@/api/post";
import { Colors } from "@/constants/theme";
import { SECURE_STORE_KEY, useAuthStore } from "@/store/useAuth";
import { registerDeviceAfterLogin } from "@/utils/deviceRegistration";
import { AuthStatusEnum, UserResponseData } from "@/types/auth";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authStore = useAuthStore();

  useEffect(() => {
    async function loadAuthStore() {
      const result = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      const parsedResult = result
        ? (JSON.parse(result) as UserResponseData)
        : null;

      if (parsedResult) {
        const nowTime = Date.now();

        const accessTokenExpires = new Date(
          parsedResult.accessToken.expires,
        ).getTime();
        const refreshTokenExpires = new Date(
          parsedResult.refreshToken.expires,
        ).getTime();

        if (accessTokenExpires < nowTime) {
          // Refresh token da mı dolmuş?
          if (refreshTokenExpires < nowTime) {
            authStore.logout();
          } else {
            // Refresh token ile yeni access token al
            postRefreshToken({ token: parsedResult.refreshToken.token })
              .then(async (data) => {
                await SecureStore.setItemAsync(
                  SECURE_STORE_KEY,
                  JSON.stringify(data),
                );
                authStore.login(data);
                registerDeviceAfterLogin().catch(() => {});
              })
              .catch(() => {
                authStore.logout();
              });
          }
        } else {
          getMe({ token: parsedResult.accessToken.token })
            .then((response) => {
              authStore.login({
                ...parsedResult,
                user: response.user,
              });
              registerDeviceAfterLogin().catch(() => {});
            })
            .catch(() => {
              authStore.logout();
            });
        }
      } else {
        authStore.logout();
      }
    }
    loadAuthStore();
  }, []);

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
              await SecureStore.setItemAsync(
                SECURE_STORE_KEY,
                JSON.stringify(data),
              );
              authStore.login(data);
            })
            .catch(() => {
              authStore.logout();
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
        <Text style={styles.loadingText}>Yükleniyor...</Text>
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
