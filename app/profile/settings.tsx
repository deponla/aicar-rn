import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

function SectionLabel({ label }: { label: string }) {
  const t = tokens;
  return (
    <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
      {label}
    </Text>
  );
}

function SettingsMenuItem({
  title,
  subtitle,
  icon,
  onPress,
  destructive,
  showDivider = true,
}: Readonly<{
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  showDivider?: boolean;
}>) {
  const t = tokens;
  return (
    <>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.6}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={destructive ? t.dangerText : t.textSecondary}
            style={styles.menuItemIcon}
          />
        )}
        <View style={styles.menuItemLeft}>
          <Text
            style={[
              styles.menuItemTitle,
              { color: destructive ? t.dangerText : t.textPrimary },
            ]}
          >
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={[styles.menuItemSubtitle, { color: t.textTertiary }]}>
            {subtitle}
          </Text>
        )}
        <MaterialIcons
          name="chevron-right"
          size={18}
          color={destructive ? t.dangerText : t.textPlaceholder}
        />
      </TouchableOpacity>
      {showDivider && (
        <View
          style={[
            styles.menuDivider,
            { backgroundColor: t.borderSubtle },
          ]}
        />
      )}
    </>
  );
}

function MenuCard({ children }: { children: React.ReactNode }) {
  const t = tokens;
  return (
    <View
      style={[
        styles.menuCard,
        { backgroundColor: t.bgSurface, borderColor: t.borderDefault },
      ]}
    >
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const t = tokens;

  if (!user) {
    return (
      <ScreenContainer title="Hesap Ayarları" showBackButton>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const languageLabel =
    (user.language?.toLowerCase() === "en" ? "English" : "Türkçe");

  const isLocalAuth = user.authProvider === "local";

  return (
    <ScreenContainer
      title="Hesap Ayarları"
      showBackButton
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: t.bgBase },
      ]}
    >
      {/* Kişisel Bilgiler */}
      <SectionLabel label="KİŞİSEL BİLGİLER" />
      <MenuCard>
        <SettingsMenuItem
          title="Profili Düzenle"
          icon="person"
          onPress={() => router.push("/profile/edit-profile")}
        />
        <SettingsMenuItem
          title="Telefon Numarası"
          icon="phone"
          subtitle={user.isPhoneVerified ? "Doğrulandı" : "Doğrulanmadı"}
          onPress={() => router.push("/profile/phone-number")}
        />
        <SettingsMenuItem
          title="E-posta Adresi"
          icon="email"
          subtitle={user.emailVerified ? "Doğrulandı" : "Doğrulanmadı"}
          onPress={() => router.push("/profile/email-address")}
          showDivider={false}
        />
      </MenuCard>

      {/* Güvenlik */}
      <SectionLabel label="GÜVENLİK" />
      <MenuCard>
        {isLocalAuth && (
          <SettingsMenuItem
            title="Şifre Değiştir"
            icon="lock"
            onPress={() => router.push("/profile/change-password")}
          />
        )}
        <SettingsMenuItem
          title="Aktif Oturumlar"
          icon="devices"
          onPress={() => router.push("/profile/active-sessions")}
          showDivider={isLocalAuth}
        />
        {!isLocalAuth && null}
      </MenuCard>

      {/* Tercihler */}
      <SectionLabel label="TERCİHLER" />
      <MenuCard>
        <SettingsMenuItem
          title="Dil / Language"
          icon="translate"
          subtitle={languageLabel}
          onPress={() => router.push("/profile/language")}
        />
        <SettingsMenuItem
          title="Bildirim Tercihleri"
          icon="notifications"
          onPress={() => router.push("/profile/notification-preferences")}
          showDivider={false}
        />
      </MenuCard>

      {/* Hesap */}
      <SectionLabel label="HESAP" />
      <MenuCard>
        <SettingsMenuItem
          title="Hesabı Kapat"
          icon="delete-outline"
          onPress={() => router.push("/profile/delete-account")}
          destructive
          showDivider={false}
        />
      </MenuCard>

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
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemLeft: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuItemSubtitle: {
    fontSize: 13,
    marginRight: 4,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
});
