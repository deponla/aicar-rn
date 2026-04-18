import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenContainer from "./ScreenContainer";

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

  return (
    <ScreenContainer title={pageTitle}>
      {/* Login Card */}
      <View style={styles.loginCard}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
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
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#6B6B6B",
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
