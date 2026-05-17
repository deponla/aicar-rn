import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import { normalizeLanguage } from "@/i18n";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

const SettingsMenuItem = memo(function SettingsMenuItem({
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
});

const MenuCard = memo(function MenuCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = tokens;
  return (
    <View
      style={[
        styles.menuCard,
        { backgroundColor: t.surfaceContainerLowest, borderColor: t.borderSubtle },
      ]}
    >
      {children}
    </View>
  );
});

export default function SettingsScreen() {
  const { t: translate } = useTranslation();
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const t = tokens;
  const languageLabel = translate(
    `common.languages.${normalizeLanguage(user?.language)}`,
  );

  const goToEditProfile = useCallback(() => {
    router.push("/profile/edit-profile");
  }, [router]);

  const goToPhoneNumber = useCallback(() => {
    router.push("/profile/phone-number");
  }, [router]);

  const goToEmailAddress = useCallback(() => {
    router.push("/profile/email-address");
  }, [router]);

  const goToChangePassword = useCallback(() => {
    router.push("/profile/change-password");
  }, [router]);

  const goToActiveSessions = useCallback(() => {
    router.push("/profile/active-sessions");
  }, [router]);

  const goToLanguage = useCallback(() => {
    router.push("/profile/language");
  }, [router]);

  const goToNotificationPreferences = useCallback(() => {
    router.push("/profile/notification-preferences");
  }, [router]);

  const goToFreezeAccount = useCallback(() => {
    router.push("/profile/freeze-account");
  }, [router]);

  const goToDeleteAccount = useCallback(() => {
    router.push("/profile/delete-account");
  }, [router]);

  if (!user) {
    return (
      <ScreenContainer title={translate("settings.title")} showBackButton>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{translate("settings.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isLocalAuth = user.authProvider === "local";

  return (
    <ScreenContainer
      title={translate("settings.title")}
      showBackButton
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: t.bgBase },
      ]}
    >
      <SectionLabel label={translate("settings.sections.personal")} />
      <MenuCard>
        <SettingsMenuItem
          title={translate("settings.editProfile")}
          icon="person"
          onPress={goToEditProfile}
        />
        <SettingsMenuItem
          title={translate("settings.phoneNumber")}
          icon="phone"
          subtitle={
            user.isPhoneVerified
              ? translate("common.status.verified")
              : translate("common.status.unverified")
          }
          onPress={goToPhoneNumber}
        />
        <SettingsMenuItem
          title={translate("settings.emailAddress")}
          icon="email"
          subtitle={
            user.emailVerified
              ? translate("common.status.verified")
              : translate("common.status.unverified")
          }
          onPress={goToEmailAddress}
          showDivider={false}
        />
      </MenuCard>

      <SectionLabel label={translate("settings.sections.security")} />
      <MenuCard>
        {isLocalAuth && (
          <SettingsMenuItem
            title={translate("settings.changePassword")}
            icon="lock"
            onPress={goToChangePassword}
          />
        )}
        <SettingsMenuItem
          title={translate("settings.activeSessions")}
          icon="devices"
          onPress={goToActiveSessions}
          showDivider={isLocalAuth}
        />
        {!isLocalAuth && null}
      </MenuCard>

      <SectionLabel label={translate("settings.sections.preferences")} />
      <MenuCard>
        <SettingsMenuItem
          title={translate("settings.language")}
          icon="translate"
          subtitle={languageLabel}
          onPress={goToLanguage}
        />
        <SettingsMenuItem
          title={translate("settings.notificationPreferences")}
          icon="notifications"
          onPress={goToNotificationPreferences}
          showDivider={false}
        />
      </MenuCard>

      <SectionLabel label={translate("settings.sections.account")} />
      <MenuCard>
        <SettingsMenuItem
          title={translate("settings.freezeAccount")}
          icon="pause-circle-outline"
          onPress={goToFreezeAccount}
          destructive
        />
        <SettingsMenuItem
          title={translate("settings.deleteAccount")}
          icon="delete-outline"
          onPress={goToDeleteAccount}
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
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: tokens.textTertiary,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    ...ambientShadow,
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
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },
  menuItemSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginRight: 4,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
});
