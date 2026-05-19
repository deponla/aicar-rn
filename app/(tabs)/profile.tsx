import { Colors, tokens, FontFamily, ambientShadow } from "@/constants/theme";
import HomeHeader from "@/components/HomeHeader";
import { PRIVACY_URL, TERMS_URL } from "@/utils/env";
import {
  AUTH_CALLBACK_ACTIONS,
} from "@/utils/parseSessionFromUrl";
import { startAuthSession } from "@/utils/authSession";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
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
  return (
    <>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View style={styles.menuItemLeft}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: iconBg ?? tokens.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name={icon}
              size={20}
              color={iconColor ?? (destructive ? tokens.danger : tokens.textPrimary)}
            />
          </View>
          <Text
            style={[
              styles.menuItemLabel,
              {
                color: destructive ? tokens.danger : tokens.textPrimary,
              },
            ]}
          >
            {label}
          </Text>
        </View>
        <View style={styles.menuItemRight}>
          {value ? (
            <Text style={[styles.menuItemValue, { color: tokens.textSecondary }]}>
              {value}
            </Text>
          ) : null}
          <MaterialIcons
            size={18}
            name="chevron-right"
            color={destructive ? tokens.danger : tokens.textTertiary}
          />
        </View>
      </TouchableOpacity>
      {showDivider && (
        <View style={styles.menuInnerDivider} />
      )}
    </>
  );
});

const MenuSection = memo(function MenuSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.menuSection}>
      {children}
    </View>
  );
});

const SectionLabel = memo(function SectionLabel({
  label,
}: {
  label: string;
}) {
  return (
    <Text style={styles.sectionLabel}>
      {label}
    </Text>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { t: translate } = useTranslation();
  const authStore = useAuthStore();
  const router = useRouter();
  const t = tokens;
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  const [webViewTitle, setWebViewTitle] = useState<string>("");
  const colorScheme = useColorScheme();

  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const user = authStore.user?.user;

  const closeWebView = useCallback(() => {
    setWebViewUrl(null);
  }, []);

  const handleAuth = useCallback(
    async (type: "login" | "register") => {
      try {
        const result = await startAuthSession(
          type,
          translate("profileScreen.errors.frontendUrlMissing"),
        );

        if (result.type === "opened-in-browser" || result.type === "cancelled") {
          return;
        }

        if (result.type === "invalid-callback") {
          Alert.alert(
            translate("profileScreen.authFailedTitle"),
            translate("auth.callback.unreadableSession"),
          );
          return;
        }

        if (result.authCallback.type === "intent") {
          if (result.authCallback.action === AUTH_CALLBACK_ACTIONS.REACTIVATE_ACCOUNT) {
            router.push({
              pathname: "/auth/reactivate",
              params: {
                email: result.authCallback.email,
                reason: result.authCallback.reason,
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
          JSON.stringify(result.authCallback.session),
        );
        authStore.login(result.authCallback.session);
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

  const appendTheme = useCallback(
    (url: string) => {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}theme=${colorScheme === "dark" ? "dark" : "light"}`;
    },
    [colorScheme],
  );

  const openTerms = useCallback(() => {
    setWebViewTitle(translate("about.links.terms"));
    setWebViewUrl(appendTheme(TERMS_URL));
  }, [appendTheme, translate]);

  const openPrivacy = useCallback(() => {
    setWebViewTitle(translate("about.links.privacy"));
    setWebViewUrl(appendTheme(PRIVACY_URL));
  }, [appendTheme, translate]);

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
      <View style={{ flex: 1, backgroundColor: tokens.bgBase }}>
        <HomeHeader />
        <StatusBar barStyle="dark-content" />
        {webViewModal}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { backgroundColor: tokens.bgBase },
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
      </View>
    );
  }

  // ── Logged in ──
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bgBase }}>
      <HomeHeader />
      <StatusBar barStyle="dark-content" />
      {webViewModal}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: tokens.bgBase },
        ]}
      >
        {/* ── Hero Header ── */}
        <View style={[styles.hero, { backgroundColor: tokens.bgBase }]}>
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
            iconBg={t.primaryLight}
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
            iconBg={t.primaryLight}
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
            iconBg={t.primaryLight}
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

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
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
    marginBottom: 16,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: tokens.surfaceContainerLowest,
    ...ambientShadow,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: tokens.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    ...ambientShadow,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    color: "#fff",
    fontSize: 36,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: tokens.surfaceContainerLowest,
  },
  heroInfo: {
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },
  heroName: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.56,
    color: tokens.textPrimary,
  },
  heroEmail: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: tokens.textSecondary,
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
    gap: 6,
    backgroundColor: tokens.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: tokens.textInverse,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: tokens.surfaceTint,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },

  // ── Menu section card ─────────────────────────────────────────────────────
  menuSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: tokens.surfaceContainerLowest,
    ...ambientShadow,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuItemLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 18,
    lineHeight: 26,
    color: tokens.textPrimary,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menuItemValue: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textSecondary,
  },
  menuInnerDivider: {
    height: 1,
    backgroundColor: tokens.surfaceVariant,
    marginLeft: 64,
  },

  // ── Guest screen ──────────────────────────────────────────────────────────
  guestHeader: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 32,
  },
  guestIconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: tokens.primaryLight,
  },
  guestTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.56,
    color: tokens.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  guestDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textSecondary,
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
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  authBtnFilled: {
    backgroundColor: tokens.primary,
  },
  authBtnOutline: {
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  authBtnFilledText: {
    fontFamily: FontFamily.semiBold,
    color: "#fff",
    fontSize: 14,
    letterSpacing: 0.7,
  },
  authBtnOutlineText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textPrimary,
    letterSpacing: 0.7,
  },
  termsText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginHorizontal: 32,
    color: tokens.textSecondary,
  },
  termsLink: {
    fontFamily: FontFamily.medium,
    color: tokens.secondary,
  },

  // ── WebView modal ─────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.bgSurface,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
  },
  modalHeaderSpacer: {
    width: 30,
  },
  modalTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: tokens.textPrimary,
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
    backgroundColor: tokens.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
});
