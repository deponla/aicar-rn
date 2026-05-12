import { Colors, tokens } from "@/constants/theme";
import {
  AUTH_CALLBACK_ACTIONS,
  parseAuthCallbackFromUrl,
} from "@/utils/parseSessionFromUrl";
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Modal,
  Platform,
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

const MenuItem = memo(function MenuItem({
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
});

const MenuSection = memo(function MenuSection({
  children,
}: {
  children: React.ReactNode;
}) {
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
});

const SectionLabel = memo(function SectionLabel({
  label,
}: {
  label: string;
}) {
  const t = tokens;
  return (
    <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
      {label}
    </Text>
  );
});

function buildAuthSessionConfig(
  type: "login" | "register",
  frontendUrlMissingMessage: string,
) {
  const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error(frontendUrlMissingMessage);
  }

  const redirectUrl = Linking.createURL("/auth/callback");
  const authUrl = new URL(`/auth/${type}`, frontendUrl);
  authUrl.searchParams.set("from", "app");
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  const useExternalBrowser =
    Platform.OS === "ios" && authUrl.protocol !== "https:";

  return {
    authUrl: authUrl.toString(),
    redirectUrl,
    useExternalBrowser,
  };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t: translate } = useTranslation();
  const authStore = useAuthStore();
  const router = useRouter();
  const t = tokens;
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string>("");

  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const user = authStore.user?.user;

  const closeWebView = useCallback(() => {
    setWebViewUrl(null);
  }, []);

  const handleAuth = useCallback(
    async (type: "login" | "register") => {
      try {
        const { authUrl, redirectUrl, useExternalBrowser } =
          buildAuthSessionConfig(
            type,
            translate("profileScreen.errors.frontendUrlMissing"),
          );

        if (useExternalBrowser) {
          await Linking.openURL(authUrl);
          return;
        }

        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUrl,
        );

        if (result.type !== "success" || !result.url) {
          return;
        }

        const authCallback = parseAuthCallbackFromUrl(result.url);

        if (!authCallback) {
          Alert.alert(
            translate("profileScreen.authFailedTitle"),
            translate("auth.callback.unreadableSession"),
          );
          return;
        }

        if (authCallback.type === "intent") {
          if (authCallback.action === AUTH_CALLBACK_ACTIONS.REACTIVATE_ACCOUNT) {
            router.push({
              pathname: "/auth/reactivate",
              params: {
                email: authCallback.email,
                reason: authCallback.reason,
              },
            });
            return;
          }

          Alert.alert(
            translate("profileScreen.authFailedTitle"),
            translate("profileScreen.errors.additionalActionRequired"),
          );
          return;
        }

        await SecureStore.setItemAsync(
          SECURE_STORE_KEY,
          JSON.stringify(authCallback.session),
        );
        authStore.login(authCallback.session);
      } catch (error) {
        Alert.alert(
          type === "login"
            ? translate("profileScreen.loginStartFailed")
            : translate("profileScreen.registerStartFailed"),
          error instanceof Error
            ? error.message
            : translate("profileScreen.errors.browserSessionFailed"),
        );
      }
    },
    [authStore, router, translate],
  );

  const handleRegister = useCallback(() => {
    void handleAuth("register");
  }, [handleAuth]);

  const handleLogin = useCallback(() => {
    void handleAuth("login");
  }, [handleAuth]);

  const handleLogout = useCallback(() => {
    Alert.alert(translate("profileScreen.logout"), translate("profileScreen.logoutConfirm"), [
      { text: translate("profileScreen.cancel"), style: "cancel" },
      {
        text: translate("profileScreen.logout"),
        style: "destructive",
        onPress: async () => {
          await authStore.logout();
        },
      },
    ]);
  }, [authStore, translate]);

  const openTerms = useCallback(() => {
    setWebViewTitle(translate("about.links.terms"));
    setWebViewUrl("https://deponla.com/terms");
  }, [translate]);

  const openPrivacy = useCallback(() => {
    setWebViewTitle(translate("about.links.privacy"));
    setWebViewUrl("https://deponla.com/privacy");
  }, [translate]);

  const goToSettings = useCallback(() => {
    router.push("/profile/settings");
  }, [router]);

  const goToPermissions = useCallback(() => {
    router.push("/profile/permissions");
  }, [router]);

  const goToCredits = useCallback(() => {
    router.push("/credits");
  }, [router]);

  const goToSupport = useCallback(() => {
    router.push("/profile/support");
  }, [router]);

  const goToFeedback = useCallback(() => {
    router.push("/profile/feedback");
  }, [router]);

  const goToFeedbackHistory = useCallback(() => {
    router.push("/profile/feedback-history");
  }, [router]);

  const goToAbout = useCallback(() => {
    router.push("/profile/about");
  }, [router]);

  const initials = useMemo(() => {
    const name = user?.name || "";
    const surname = user?.surname || "";

    if (name || surname) {
      return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    }

    return user?.email?.charAt(0).toUpperCase() ?? "?";
  }, [user?.email, user?.name, user?.surname]);

  const displayName = useMemo(
    () =>
      user?.name && user?.surname
        ? `${user.name} ${user.surname}`
        : (user?.email ?? ""),
    [user?.email, user?.name, user?.surname],
  );

  // ── WebView modal ──
  const webViewModal = (
    <Modal
      visible={webViewUrl !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeWebView}
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
            onPress={closeWebView}
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
              {translate("profileScreen.guestTitle")}
            </Text>
            <Text style={[styles.guestDesc, { color: t.textSecondary }]}>
              {translate("profileScreen.guestDescription")}
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
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.authBtnOutlineText, { color: t.textPrimary }]}
              >
                {translate("profileScreen.register")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBtn, styles.authBtnFilled]}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.authBtnFilledText}>{translate("tabs.signIn")}</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={[styles.termsText, { color: t.textTertiary }]}>
            {translate("profileScreen.termsPrefix")}{" "}
            <Text
              style={[styles.termsLink, { color: Colors.secondary }]}
              onPress={openTerms}
            >
              {translate("about.links.terms")}
            </Text>{" "}
            {translate("profileScreen.termsMiddle")}{" "}
            <Text
              style={[styles.termsLink, { color: Colors.secondary }]}
              onPress={openPrivacy}
            >
              {translate("about.links.privacy")}
            </Text>
            {translate("profileScreen.termsSuffix")}
          </Text>

          {/* ── Keşfet ── */}
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
              onPress={goToSettings}
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
                  <Text style={styles.avatarText}>{initials}</Text>
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
                    {translate("profileScreen.emailChip")}
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
                    {translate("profileScreen.phoneChip")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Hesabım ── */}
        <SectionLabel label={translate("profileScreen.sections.account")} />
        <MenuSection>
          <MenuItem
            icon="manage-accounts"
            label={translate("settings.title")}
            onPress={goToSettings}
          />
          <MenuItem
            icon="security"
            iconBg="#ECFDF3"
            iconColor="#059669"
            label={translate("profileScreen.permissions")}
            onPress={goToPermissions}
          />
          <MenuItem
            icon="monetization-on"
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            label={translate("credits.title")}
            onPress={goToCredits}
            showDivider={false}
          />
        </MenuSection>

        {/* ── Keşfet ── */}
        {/* ── Destek ── */}
        <SectionLabel label={translate("profileScreen.sections.support")} />
        <MenuSection>
          <MenuItem
            icon="help-outline"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            label={translate("profileScreen.support")}
            onPress={goToSupport}
          />
          <MenuItem
            icon="campaign"
            iconBg="#FFF7ED"
            iconColor="#C2410C"
            label={translate("profileScreen.feedback")}
            onPress={goToFeedback}
          />
          <MenuItem
            icon="history"
            iconBg="#EEF2FF"
            iconColor="#4338CA"
            label={translate("profileScreen.feedbackHistory")}
            onPress={goToFeedbackHistory}
          />
          <MenuItem
            icon="info-outline"
            iconBg="#EFF6FF"
            iconColor="#3B82F6"
            label={translate("about.title")}
            onPress={goToAbout}
          />
          <MenuItem
            icon="description"
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            label={translate("about.links.terms")}
            onPress={openTerms}
          />
          <MenuItem
            icon="privacy-tip"
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            label={translate("about.links.privacy")}
            onPress={openPrivacy}
            showDivider={false}
          />
        </MenuSection>

        {/* ── Çıkış ── */}
        <SectionLabel label="" />
        <MenuSection>
          <MenuItem
            icon="logout"
            label={translate("profileScreen.logout")}
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
