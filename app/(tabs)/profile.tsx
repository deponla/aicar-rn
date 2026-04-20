import { Colors, tokens } from "@/constants/theme";
import { parseSessionFromUrl } from "@/utils/parseSessionFromUrl";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { SECURE_STORE_KEY, useAuthStore } from "../../store/useAuth";
import { AuthStatusEnum } from "../../types/auth";

// ─── Sub-components ────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showDivider?: boolean;
  destructive?: boolean;
}

function MenuItem({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  onPress,
  showDivider = true,
  destructive = false,
}: MenuItemProps) {
  const t = tokens;

  return (
    <>
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: t.bgSurface }]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View style={styles.menuItemLeft}>
          <Text
            style={[
              styles.menuItemLabel,
              {
                color: destructive ? t.dangerText : t.textPrimary,
              },
            ]}
          >
            {label}
          </Text>
        </View>
        <View style={styles.menuItemRight}>
          {value ? (
            <Text style={[styles.menuItemValue, { color: t.textTertiary }]}>
              {value}
            </Text>
          ) : null}
          <MaterialIcons
            size={18}
            name="chevron-right"
            color={destructive ? t.dangerText : t.textPlaceholder}
          />
        </View>
      </TouchableOpacity>
      {showDivider && (
        <View
          style={[
            styles.menuInnerDivider,
            { backgroundColor: t.borderDefault, marginLeft: 16 },
          ]}
        />
      )}
    </>
  );
}

function MenuSection({ children }: { children: React.ReactNode }) {
  const t = tokens;
  return (
    <View
      style={[
        styles.menuSection,
        {
          backgroundColor: t.bgSurface,
          borderColor: t.borderSubtle,
        },
      ]}
    >
      {children}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const t = tokens;
  return (
    <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
      {label}
    </Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const authStore = useAuthStore();
  const router = useRouter();
  const t = tokens;
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string>("");

  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const user = authStore.user?.user;

  const handleAuth = async (type: "login" | "register") => {
    const result = await WebBrowser.openAuthSessionAsync(
      `${process.env.EXPO_PUBLIC_FRONTEND_URL}/auth/${type}?from=app`,
      "deponla",
    );
    if (result.type === "success" && result.url) {
      const sessionData = parseSessionFromUrl(result.url);
      if (sessionData) {
        await SecureStore.setItemAsync(
          SECURE_STORE_KEY,
          JSON.stringify(sessionData),
        );
        authStore.login(sessionData);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Çıkış yapmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await authStore.logout();
        },
      },
    ]);
  };

  const openTerms = () => {
    setWebViewTitle("Kullanım Koşulları");
    setWebViewUrl("https://deponla.com/terms");
  };

  const openPrivacy = () => {
    setWebViewTitle("Gizlilik Politikası");
    setWebViewUrl("https://deponla.com/privacy");
  };

  const getInitials = () => {
    const n = user?.name || "";
    const s = user?.surname || "";
    if (n || s) return `${n.charAt(0)}${s.charAt(0)}`.toUpperCase();
    return user?.email?.charAt(0).toUpperCase() ?? "?";
  };

  const displayName =
    user?.name && user?.surname
      ? `${user.name} ${user.surname}`
      : (user?.email ?? "");

  // ── WebView modal ──
  const webViewModal = (
    <Modal
      visible={webViewUrl !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setWebViewUrl(null)}
    >
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: t.bgSurface }]}
        edges={["top"]}
      >
        <View
          style={[styles.modalHeader, { borderBottomColor: t.borderDefault }]}
        >
          <View style={styles.modalHeaderSpacer} />
          <Text style={[styles.modalTitle, { color: t.textPrimary }]}>
            {webViewTitle}
          </Text>
          <TouchableOpacity
            onPress={() => setWebViewUrl(null)}
            style={styles.closeButton}
          >
            <View
              style={[styles.closeButtonCircle, { backgroundColor: t.bgMuted }]}
            >
              <MaterialIcons size={16} name="close" color={t.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
        {webViewUrl && (
          <WebView source={{ uri: webViewUrl }} style={{ flex: 1 }} />
        )}
      </SafeAreaView>
    </Modal>
  );

  // ── Not logged in ──
  if (!isLoggedIn) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: "#fff" }]}
        edges={["top"]}
      >
        <StatusBar barStyle="dark-content" />
        {webViewModal}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: "#fff" },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.guestHeader}>
            <View
              style={[
                styles.guestIconCircle,
                { backgroundColor: t.primaryLight },
              ]}
            >
              <MaterialIcons name="person" size={48} color={Colors.primary} />
            </View>
            <Text style={[styles.guestTitle, { color: t.textPrimary }]}>
              Hesabınıza giriş yapın
            </Text>
            <Text style={[styles.guestDesc, { color: t.textSecondary }]}>
              Profilinizi yönetin, depolarınıza erişin ve tüm özellikleri
              kullanın.
            </Text>
          </View>

          {/* Auth buttons */}
          <View style={styles.authRow}>
            <TouchableOpacity
              style={[
                styles.authBtn,
                styles.authBtnOutline,
                { borderColor: t.borderDefault, backgroundColor: t.bgSurface },
              ]}
              onPress={() => handleAuth("register")}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.authBtnOutlineText, { color: t.textPrimary }]}
              >
                Kayıt Ol
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBtn, styles.authBtnFilled]}
              onPress={() => handleAuth("login")}
              activeOpacity={0.8}
            >
              <Text style={styles.authBtnFilledText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={[styles.termsText, { color: t.textTertiary }]}>
            Devam ederek{" "}
            <Text
              style={[styles.termsLink, { color: Colors.secondary }]}
              onPress={openTerms}
            >
              Kullanım Koşulları
            </Text>{" "}
            ve{" "}
            <Text
              style={[styles.termsLink, { color: Colors.secondary }]}
              onPress={openPrivacy}
            >
              Gizlilik Politikası
            </Text>
            {"'nı kabul etmiş olursunuz."}
          </Text>

          {/* ── Keşfet ── */}
          <SectionLabel label="KEŞFET" />
          <MenuSection>
            <MenuItem
              icon="article"
              iconBg="#FEF3C7"
              iconColor="#D97706"
              label="Blog"
              onPress={() => router.push("/profile/blog")}
              showDivider={false}
            />
          </MenuSection>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Logged in ──
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: "#fff" }]}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />
      {webViewModal}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: "#fff" },
        ]}
      >
        {/* ── Hero Header ── */}
        <View style={[styles.hero, { backgroundColor: "#fff" }]}>
          <View style={styles.heroInner}>
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => router.push("/profile/settings")}
              activeOpacity={0.85}
            >
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: Colors.primary },
                  ]}
                >
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              )}
              {/* Camera badge */}
              <View
                style={[
                  styles.avatarBadge,
                  { backgroundColor: Colors.secondary },
                ]}
              >
                <MaterialIcons name="edit" size={11} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Name + email */}
            <View style={styles.heroInfo}>
              <Text
                style={[styles.heroName, { color: t.textPrimary }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {user?.email ? (
                <Text
                  style={[styles.heroEmail, { color: t.textSecondary }]}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              ) : null}
            </View>

            {/* Verification chips */}
            <View style={styles.heroChips}>
              {user?.emailVerified ? (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: t.primaryLight,
                      borderColor: t.borderDefault,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="verified"
                    size={12}
                    color={Colors.primary}
                  />
                  <Text style={[styles.chipText, { color: t.textPrimary }]}>
                    E-posta
                  </Text>
                </View>
              ) : null}
              {user?.isPhoneVerified ? (
                <View
                  style={[
                    styles.chip,
                    {
                      backgroundColor: t.primaryLight,
                      borderColor: t.borderDefault,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="phone"
                    size={12}
                    color={Colors.primary}
                  />
                  <Text style={[styles.chipText, { color: t.textPrimary }]}>
                    Telefon
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Hesabım ── */}
        <SectionLabel label="HESABIM" />
        <MenuSection>
          <MenuItem
            icon="manage-accounts"
            label="Hesap Ayarları"
            onPress={() => router.push("/profile/settings")}
          />
          <MenuItem
            icon="security"
            iconBg="#ECFDF3"
            iconColor="#059669"
            label="İzinler"
            onPress={() => router.push("/profile/permissions")}
            showDivider={false}
          />
        </MenuSection>

        {/* ── Keşfet ── */}
        <SectionLabel label="KEŞFET" />
        <MenuSection>
          <MenuItem
            icon="article"
            iconBg="#FEF3C7"
            iconColor="#D97706"
            label="Blog"
            onPress={() => router.push("/profile/blog")}
            showDivider={false}
          />
        </MenuSection>

        {/* ── Destek ── */}
        <SectionLabel label="DESTEK" />
        <MenuSection>
          <MenuItem
            icon="help-outline"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            label="Yardım al"
          />
          <MenuItem
            icon="description"
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            label="Kullanım Koşulları"
            onPress={openTerms}
          />
          <MenuItem
            icon="privacy-tip"
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            label="Gizlilik Politikası"
            onPress={openPrivacy}
            showDivider={false}
          />
        </MenuSection>

        {/* ── Çıkış ── */}
        <SectionLabel label="" />
        <MenuSection>
          <MenuItem
            icon="logout"
            label="Çıkış Yap"
            destructive
            onPress={handleLogout}
            showDivider={false}
          />
        </MenuSection>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    overflow: "hidden",
    paddingBottom: 28,
  },
  heroInner: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.08)",
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroInfo: {
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 14,
  },
  heroChips: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  chipText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },

  // ── Menu section card ─────────────────────────────────────────────────────
  menuSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menuItemValue: {
    fontSize: 14,
  },
  menuInnerDivider: {
    height: StyleSheet.hairlineWidth,
  },

  // ── Guest screen ──────────────────────────────────────────────────────────
  guestHeader: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  guestIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  guestDesc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  authRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  authBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  authBtnFilled: {
    backgroundColor: Colors.primary,
  },
  authBtnOutline: {
    borderWidth: 1,
  },
  authBtnFilledText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  authBtnOutlineText: {
    fontSize: 15,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginHorizontal: 32,
  },
  termsLink: {
    fontWeight: "500",
  },

  // ── WebView modal ─────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalHeaderSpacer: {
    width: 30,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
});
