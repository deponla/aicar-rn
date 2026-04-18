import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { usePatchUsers } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function EditProfileScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const { notify } = useNotification();
  const patchUser = usePatchUsers();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setSurname(user.surname || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const getInitials = () => {
    const n = user?.name || "";
    const s = user?.surname || "";
    return `${n.charAt(0)}${s.charAt(0)}`.toUpperCase() || "?";
  };

  const hasChanges =
    name !== (user?.name || "") ||
    surname !== (user?.surname || "") ||
    phone !== (user?.phone || "");

  const isValid = name.trim().length > 0 && surname.trim().length > 0;

  const handleSave = async () => {
    if (!user?.id || !isValid) return;

    try {
      await patchUser.mutateAsync({
        id: user.id,
        d: {
          name: name.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
        },
      });

      if (authStore.user) {
        authStore.login({
          ...authStore.user,
          user: {
            ...authStore.user.user,
            name: name.trim(),
            surname: surname.trim(),
            phone: phone.trim(),
          },
        });
      }

      notify({
        type: "success",
        title: "Profil güncellendi",
      });
      router.back();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Profil güncellenirken bir hata oluştu.";
      notify({
        type: "error",
        title: "Güncelleme başarısız",
        message,
      });
    }
  };

  if (!user) {
    return (
      <ScreenContainer title="Kişisel Bilgilerim" showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Kişisel Bilgilerim"
      showBackButton
      headerRight={
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || !isValid || patchUser.isPending}
          activeOpacity={0.7}
          style={[
            styles.saveHeaderBtn,
            (!hasChanges || !isValid) && styles.saveHeaderBtnDisabled,
          ]}
        >
          {patchUser.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={[
                styles.saveHeaderBtnText,
                (!hasChanges || !isValid) && styles.saveHeaderBtnTextDisabled,
              ]}
            >
              Kaydet
            </Text>
          )}
        </TouchableOpacity>
      }
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {user.photo ? (
            <Image source={{ uri: user.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>
            Profil fotoğrafınızı web üzerinden değiştirebilirsiniz
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Kişisel Bilgiler</Text>
          </View>
          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ad *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Adınızı girin"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {name.length === 0 && (
                <Text style={styles.errorText}>Ad alanı zorunludur</Text>
              )}
            </View>

            {/* Surname */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Soyad *</Text>
              <TextInput
                style={styles.input}
                value={surname}
                onChangeText={setSurname}
                placeholder="Soyadınızı girin"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {surname.length === 0 && (
                <Text style={styles.errorText}>Soyad alanı zorunludur</Text>
              )}
            </View>

            {/* Email (read-only) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <View style={styles.readOnlyField}>
                <MaterialIcons name="lock" size={16} color="#C7C7CC" />
                <Text style={styles.readOnlyText}>{user.email}</Text>
              </View>
              <Text style={styles.helperText}>
                E-posta adresinizi değiştirmek için destek ile iletişime geçin
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Telefon numaranız"
                placeholderTextColor="#C7C7CC"
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || !isValid || patchUser.isPending) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || !isValid || patchUser.isPending}
          activeOpacity={0.8}
        >
          {patchUser.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </KeyboardAvoidingView>
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

  // Save Header Button
  saveHeaderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveHeaderBtnDisabled: {
    backgroundColor: "#E5E5EA",
  },
  saveHeaderBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  saveHeaderBtnTextDisabled: {
    color: "#8E8E93",
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#F2F2F7",
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#F2F2F7",
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
  },
  avatarHint: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F2F2F7",
    marginHorizontal: 20,
  },
  cardBody: {
    padding: 20,
    gap: 20,
  },

  // Fields
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3C3C43",
    marginBottom: 2,
  },
  input: {
    backgroundColor: "#F9F9FB",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1C1C1E",
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontSize: 16,
    color: "#8E8E93",
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
  },

  // Save Button
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: "#C7C7CC",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // Cancel
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "600",
  },
});
