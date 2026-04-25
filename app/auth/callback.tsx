import { Colors } from "@/constants/theme";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SECURE_STORE_KEY, useAuthStore } from "../../store/useAuth";
import { UserResponseData } from "../../types/auth";
import { parseSessionFromUrl } from "../../utils/parseSessionFromUrl";

export default function AuthCallback() {
  const params = useLocalSearchParams<{ session?: string }>();
  const router = useRouter();
  const authStore = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const saveSessionAndRedirect = async (sessionData: UserResponseData) => {
      await SecureStore.setItemAsync(
        SECURE_STORE_KEY,
        JSON.stringify(sessionData),
      );
      authStore.login(sessionData);
      router.replace("/(tabs)/profile");
    };

    const handleDeepLink = async () => {
      const url = await Linking.getInitialURL();

      if (url) {
        const sessionData = parseSessionFromUrl(url);
        if (sessionData) {
          await saveSessionAndRedirect(sessionData);
          return;
        }

        setErrorMessage(
          "Uygulamaya dönen oturum bilgisi okunamadı. Lütfen yeniden giriş yapın.",
        );
        return;
      }

      if (params.session) {
        const sessionData = parseSessionFromUrl(`?session=${params.session}`);
        if (sessionData) {
          await saveSessionAndRedirect(sessionData);
          return;
        }

        setErrorMessage(
          "Oturum verisi eksik veya bozuk görünüyor. Lütfen tekrar deneyin.",
        );
        return;
      }

      setErrorMessage(
        "Tamamlanacak bir giriş oturumu bulunamadı. Lütfen profilden tekrar deneyin.",
      );
    };

    handleDeepLink();
  }, [params.session, authStore, router]);

  if (errorMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Giriş Tamamlanamadı</Text>
        <Text style={styles.subtitle}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonLabel}>Profile Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.title}>Giriş Yapılıyor...</Text>
      <Text style={styles.subtitle}>Lütfen bekleyin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F4F8",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  debug: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 20,
    fontFamily: "monospace",
  },
});
