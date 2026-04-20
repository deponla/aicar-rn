import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuth";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function SettingsMenuItem({
  title,
  onPress,
}: Readonly<{
  title: string;
  onPress: () => void;
}>) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuItemTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const t = tokens;

  if (!user) {
    return (
      <ScreenContainer title="Hesap bilgilerim" showBackButton>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Hesap bilgilerim"
      showBackButton
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: t.bgBase },
      ]}
    >
      <View style={styles.menuCard}>
        <SettingsMenuItem
          title="Kişisel bilgilerim"
          onPress={() => router.push("/profile/edit-profile")}
        />
        <View style={styles.menuDivider} />
        <SettingsMenuItem
          title="Cep telefonu numaram"
          onPress={() => router.push("/profile/phone-number")}
        />
        <View style={styles.menuDivider} />
        <SettingsMenuItem
          title="E-posta adresim"
          onPress={() => router.push("/profile/email-address")}
        />
        <View style={styles.menuDivider} />
        <SettingsMenuItem
          title="Hesap iptali"
          onPress={() => router.push("/profile/delete-account")}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Mevcut durum</Text>
        <Text style={styles.infoText}>
          E-posta: {user.emailVerified ? "Doğrulandı" : "Doğrulanmadı"}
        </Text>
        <Text style={styles.infoText}>
          Telefon: {user.isPhoneVerified ? "Doğrulandı" : "Doğrulanmadı"}
        </Text>
      </View>

      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Not</Text>
        <Text style={styles.helpText}>
          Ödeme bilgileri bu sürümde kapsam dışında bırakıldı. Hesap güvenliği
          akışları bu menü altından yönetilebilir.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECEC",
    overflow: "hidden",
    marginTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  menuItemLeft: {
    flex: 1,
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 17,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
    marginLeft: 18,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 18,
    marginTop: 18,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#3C3C43",
  },
  helpCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 18,
    marginTop: 18,
    gap: 6,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C2410C",
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#9A3412",
  },
});
