import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { changeAppLanguage, normalizeLanguage } from "@/i18n";
import { usePatchUsers } from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { usePreferencesStore } from "@/store/usePreferences";
import { notifyApiError } from "@/utils/apiError";
import {
  getTextSizeLabelKey,
  TEXT_SIZE_PRESETS,
  type TextSizePreset,
} from "@/utils/textSize";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const LANGUAGES = [
  { code: "tr", flag: "🇹🇷" },
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
] as const;

const PRESET_ICONS: Record<TextSizePreset, keyof typeof MaterialIcons.glyphMap> = {
  small: "text-decrease",
  medium: "text-fields",
  large: "format-size",
  extraLarge: "title",
};

function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalPanel} onPress={() => { }}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              hitSlop={8}
            >
              <MaterialIcons name="close" size={22} color={tokens.textSecondary} />
            </TouchableOpacity>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default function SettingsScreen() {
  const { t: translate } = useTranslation();
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const t = tokens;
  const { notify } = useNotification();
  const patchUser = usePatchUsers();
  const textSizePreset = usePreferencesStore((state) => state.textSizePreset);
  const setTextSizePreset = usePreferencesStore(
    (state) => state.setTextSizePreset,
  );
  const languageLabel = translate(
    `common.languages.${normalizeLanguage(user?.language)}`,
  );
  const textSizeLabel = translate(getTextSizeLabelKey(textSizePreset));

  // Modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [textSizeModalVisible, setTextSizeModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState(() =>
    normalizeLanguage(user?.language),
  );
  const [isSavingLang, setIsSavingLang] = useState(false);

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
    setSelectedLang(normalizeLanguage(user?.language));
    setLanguageModalVisible(true);
  }, [user?.language]);

  const goToNotificationPreferences = useCallback(() => {
    router.push("/profile/notification-preferences");
  }, [router]);

  const goToTextSize = useCallback(() => {
    setTextSizeModalVisible(true);
  }, []);

  const handleLanguageSave = useCallback(async () => {
    const currentLang = normalizeLanguage(user?.language);
    if (selectedLang === currentLang) {
      setLanguageModalVisible(false);
      return;
    }

    try {
      setIsSavingLang(true);
      const nextLanguage = await changeAppLanguage(selectedLang);
      await patchUser.mutateAsync({
        id: user!.id,
        d: { language: nextLanguage },
      });

      mergeAuthenticatedUser({ language: nextLanguage });
      notify({ type: "success", title: translate("language.saved") });
      setLanguageModalVisible(false);
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: translate("language.retryLater"),
        notify,
        title: translate("language.saveFailed"),
      });
    } finally {
      setIsSavingLang(false);
    }
  }, [selectedLang, user, patchUser, notify, translate]);

  const handleTextSizeSelect = useCallback(
    (preset: TextSizePreset) => {
      void setTextSizePreset(preset);
    },
    [setTextSizePreset],
  );

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

      <SectionLabel label={translate("settings.sections.appSettings")} />
      <MenuCard>
        <SettingsMenuItem
          title={translate("settings.language")}
          icon="translate"
          subtitle={languageLabel}
          onPress={goToLanguage}
        />
        <SettingsMenuItem
          title={translate("settings.textSize")}
          icon="format-size"
          subtitle={textSizeLabel}
          onPress={goToTextSize}
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

      {/* Language Modal */}
      <BottomSheetModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        title={translate("language.title")}
      >
        <View style={styles.modalBody}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalOptionCard,
                  {
                    borderColor: isSelected
                      ? Colors.primary + "60"
                      : t.borderDefault,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedLang(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.modalOptionLabel,
                    {
                      color: t.textPrimary,
                      fontFamily: isSelected
                        ? FontFamily.bold
                        : FontFamily.medium,
                    },
                  ]}
                >
                  {translate(`common.languages.${lang.code}`)}
                </Text>
                <MaterialIcons
                  name={isSelected ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                  color={isSelected ? Colors.primary : t.textPlaceholder}
                />
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[
              styles.modalSaveButton,
              (selectedLang === normalizeLanguage(user?.language) || isSavingLang) &&
              styles.modalSaveButtonDisabled,
            ]}
            onPress={handleLanguageSave}
            disabled={
              selectedLang === normalizeLanguage(user?.language) || isSavingLang
            }
            activeOpacity={0.8}
          >
            {isSavingLang ? (
              <ActivityIndicator color={tokens.textInverse} />
            ) : (
              <Text style={styles.modalSaveButtonText}>
                {translate("language.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      {/* Text Size Modal */}
      <BottomSheetModal
        visible={textSizeModalVisible}
        onClose={() => setTextSizeModalVisible(false)}
        title={translate("textSize.title")}
      >
        <View style={styles.modalBody}>
          {TEXT_SIZE_PRESETS.map((preset) => {
            const isSelected = preset === textSizePreset;
            return (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.modalOptionCard,
                  {
                    borderColor: isSelected
                      ? Colors.primary + "60"
                      : t.borderDefault,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleTextSizeSelect(preset)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={PRESET_ICONS[preset]}
                  size={22}
                  color={isSelected ? Colors.primary : t.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.modalOptionLabel,
                      {
                        color: isSelected ? Colors.primary : t.textPrimary,
                        fontFamily: isSelected
                          ? FontFamily.bold
                          : FontFamily.medium,
                      },
                    ]}
                  >
                    {translate(getTextSizeLabelKey(preset))}
                  </Text>
                  <Text
                    style={[
                      styles.modalOptionDescription,
                      { color: t.textSecondary },
                    ]}
                  >
                    {translate(`textSize.descriptions.${preset}`)}
                  </Text>
                </View>
                <MaterialIcons
                  name={isSelected ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                  color={isSelected ? Colors.primary : t.textPlaceholder}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetModal>
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
    minWidth: 0,
  },
  menuItemTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },
  menuItemSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginRight: 4,
    flexShrink: 1,
    textAlign: "right",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.borderDefault,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    gap: 10,
  },
  modalOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: tokens.bgSurface,
    ...ambientShadow,
  },
  modalOptionFlag: {
    fontSize: 26,
  },
  modalOptionLabel: {
    fontSize: 16,
    flex: 1,
  },
  modalOptionDescription: {
    marginTop: 2,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: 8,
  },
  modalSaveButtonDisabled: {
    opacity: 0.45,
  },
  modalSaveButtonText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textInverse,
    fontSize: 16,
  },
});
