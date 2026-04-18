import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { usePatchUsers, useSendEmailVerification } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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
  const patchUser = usePatchUsers();
  const sendEmailVerification = useSendEmailVerification();
  const [email, setEmail] = useState(user?.email || "");

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  if (!user) {
    return (
      <ScreenContainer title="E-posta adresim" showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isDirty = email.trim() !== user.email;

  const syncUser = (nextEmail: string, emailVerified: boolean) => {
    if (!authStore.user) return;
    authStore.login({
      ...authStore.user,
      user: {
        ...authStore.user.user,
        email: nextEmail,
        emailVerified,
        emailVerifiedAt: emailVerified
          ? authStore.user.user.emailVerifiedAt
          : null,
      },
    });
  };

  const handleSaveEmail = async () => {
    try {
      const nextEmail = email.trim();
      await patchUser.mutateAsync({
        id: user.id,
        d: { email: nextEmail },
      });

      syncUser(nextEmail, false);

      notify({
        type: "success",
        title: "E-posta güncellendi",
        message: "Yeni adresinizi doğrulamanız gerekiyor.",
      });
    } catch (error: any) {
      notify({
        type: "error",
        title: "E-posta güncellenemedi",
        message:
          error?.response?.data?.message || "Lütfen daha sonra tekrar deneyin.",
      });
    }
  };

  const handleSendVerification = async () => {
    try {
      const response = await sendEmailVerification.mutateAsync();
      notify({
        type: "success",
        title: "Doğrulama e-postası gönderildi",
        message: response.message,
      });
    } catch (error: any) {
      notify({
        type: "error",
        title: "E-posta gönderilemedi",
        message:
          error?.response?.data?.message || "Lütfen daha sonra tekrar deneyin.",
      });
    }
  };

  return (
    <ScreenContainer title="E-posta adresim" showBackButton>
      <View style={styles.card}>
        <Text style={styles.title}>Kayıtlı e-posta</Text>
        <Text style={styles.subtitle}>
          E-posta değişikliği yaptığınızda doğrulama durumunuz sıfırlanır.
        </Text>

        <Text style={styles.label}>E-posta adresi</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="ornek@mail.com"
          placeholderTextColor="#C7C7CC"
        />

        <Text style={styles.statusText}>
          Durum:{" "}
          {user.emailVerified && !isDirty ? "Doğrulandı" : "Doğrulanmadı"}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, !isDirty && styles.disabledButton]}
          onPress={handleSaveEmail}
          disabled={!isDirty || patchUser.isPending}
          activeOpacity={0.8}
        >
          {patchUser.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>E-postayı kaydet</Text>
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
              Doğrulama e-postası gönder
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
    fontSize: 15,
    color: "#8E8E93",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 18,
    gap: 12,
    marginTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3C3C43",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1C1E",
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    fontSize: 14,
    color: "#4B5563",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.45,
  },
});
