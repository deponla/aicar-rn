import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import {
  usePatchUsers,
  useSendSmsOtp,
  useVerifySmsOtp,
} from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { SmsOtpType } from "@/types/user";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  const patchUser = usePatchUsers();
  const sendSmsOtp = useSendSmsOtp();
  const verifySmsOtp = useVerifySmsOtp();

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [savedPhone, setSavedPhone] = useState(user?.phone || "");

  useEffect(() => {
    setPhone(user?.phone || "");
    setSavedPhone(user?.phone || "");
  }, [user?.phone]);

  if (!user) {
    return (
      <ScreenContainer title="Cep telefonu numaram" showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isDirty = phone.trim() !== savedPhone;

  const syncUser = (nextPhone: string, isPhoneVerified: boolean) => {
    if (!authStore.user) return;
    authStore.login({
      ...authStore.user,
      user: {
        ...authStore.user.user,
        phone: nextPhone,
        isPhoneVerified,
      },
    });
  };

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
      syncUser(nextPhone, false);

      notify({
        type: "success",
        title: "Telefon numarası güncellendi",
        message: "Yeni numaranızı doğrulamanız gerekiyor.",
      });
    } catch (error: any) {
      notify({
        type: "error",
        title: "Telefon güncellenemedi",
        message:
          error?.response?.data?.message || "Lütfen daha sonra tekrar deneyin.",
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
        title: "Doğrulama kodu gönderildi",
        message: response.message,
      });
    } catch (error: any) {
      notify({
        type: "error",
        title: "Kod gönderilemedi",
        message:
          error?.response?.data?.message || "Lütfen daha sonra tekrar deneyin.",
      });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      await verifySmsOtp.mutateAsync({
        otpCode: otpCode.trim(),
        type: SmsOtpType.PHONE_VERIFICATION,
      });

      syncUser(savedPhone, true);
      setOtpCode("");

      notify({
        type: "success",
        title: "Telefon doğrulandı",
      });
    } catch (error: any) {
      notify({
        type: "error",
        title: "Kod doğrulanamadı",
        message:
          error?.response?.data?.message || "Lütfen daha sonra tekrar deneyin.",
      });
    }
  };

  return (
    <ScreenContainer title="Cep telefonu numaram" showBackButton>
      <View style={styles.card}>
        <Text style={styles.title}>Telefon numaranız</Text>
        <Text style={styles.subtitle}>
          Numaranızı güncelledikten sonra SMS doğrulama kodu gönderin.
        </Text>

        <Text style={styles.label}>Telefon</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="05XX XXX XX XX"
          placeholderTextColor="#C7C7CC"
        />

        <Text style={styles.statusText}>
          Durum:{" "}
          {user.isPhoneVerified && !isDirty ? "Doğrulandı" : "Doğrulanmadı"}
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, !isDirty && styles.disabledButton]}
          onPress={handleSavePhone}
          disabled={!isDirty || patchUser.isPending}
          activeOpacity={0.8}
        >
          {patchUser.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Numarayı kaydet</Text>
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
            <Text style={styles.secondaryButtonText}>SMS kodu gönder</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Doğrulama kodu</Text>
        <TextInput
          style={styles.input}
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          placeholder="6 haneli kod"
          placeholderTextColor="#C7C7CC"
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Kodu doğrula</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Text style={styles.linkText}>Geri dön</Text>
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
    marginBottom: 18,
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
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
