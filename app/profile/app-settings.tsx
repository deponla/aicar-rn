import { useNotification } from "@/components/Notification";
import {
  BottomSheetModal,
  MenuCard,
  SectionLabel,
  SettingsMenuItem,
} from "@/components/ProfileSettingsMenu";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { changeAppLanguage, normalizeLanguage } from "@/i18n";
import { usePatchUsers } from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { usePreferencesStore } from "@/store/usePreferences";
import { notifyApiError } from "@/utils/apiError";
import { getSettingsItemLabel } from "@/utils/settingsLabels";
import {
  getTextSizeLabelKey,
  TEXT_SIZE_PRESETS,
  type TextSizePreset,
} from "@/utils/textSize";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

export default function AppSettingsScreen() {
  const { t: translate, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user?.user);
  const router = useRouter();
  const { notify } = useNotification();
  const patchUser = usePatchUsers();
  const textSizePreset = usePreferencesStore((state) => state.textSizePreset);
  const setTextSizePreset = usePreferencesStore(
    (state) => state.setTextSizePreset,
  );
  const userId = user?.id;
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const languageLabel = translate(`common.languages.${currentLanguage}`);
  const textSizeLabel = translate(getTextSizeLabelKey(textSizePreset));
  const title = getSettingsItemLabel(
    translate,
    "appSettings",
    currentLanguage,
  );

  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [textSizeModalVisible, setTextSizeModalVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLanguage);
  const [isSavingLang, setIsSavingLang] = useState(false);

  const goToLanguage = useCallback(() => {
    setSelectedLang(currentLanguage);
    setLanguageModalVisible(true);
  }, [currentLanguage]);

  const goToNotificationPreferences = useCallback(() => {
    router.push("/profile/notification-preferences");
  }, [router]);

  const goToTextSize = useCallback(() => {
    setTextSizeModalVisible(true);
  }, []);

  const handleLanguageSelect = useCallback(
    async (nextLanguageCode: (typeof LANGUAGES)[number]["code"]) => {
      if (isSavingLang) {
        return;
      }

      setSelectedLang(nextLanguageCode);

      if (nextLanguageCode === currentLanguage) {
        setLanguageModalVisible(false);
        return;
      }

      if (!userId) {
        return;
      }

      const previousLanguage = currentLanguage;

      try {
        setIsSavingLang(true);
        const nextLanguage = await changeAppLanguage(nextLanguageCode);
        await patchUser.mutateAsync({
          id: userId,
          d: { language: nextLanguage },
        });

        await mergeAuthenticatedUser({ language: nextLanguage });
        setSelectedLang(nextLanguage);
        notify({ type: "success", title: translate("language.saved") });
        setLanguageModalVisible(false);
      } catch (error: unknown) {
        setSelectedLang(previousLanguage);
        await changeAppLanguage(previousLanguage).catch(() => undefined);
        notifyApiError({
          error,
          fallbackMessage: translate("language.retryLater"),
          notify,
          title: translate("language.saveFailed"),
        });
      } finally {
        setIsSavingLang(false);
      }
    },
    [currentLanguage, isSavingLang, notify, patchUser, translate, userId],
  );

  const handleTextSizeSelect = useCallback(
    (preset: TextSizePreset) => {
      void setTextSizePreset(preset);
      setTextSizeModalVisible(false);
    },
    [setTextSizePreset],
  );

  if (!user) {
    return (
      <ScreenContainer
        title={title}
        showBackButton
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{translate("settings.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={title}
      showBackButton
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: tokens.bgBase },
      ]}
    >
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
                      : tokens.borderDefault,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => void handleLanguageSelect(lang.code)}
                disabled={isSavingLang}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.modalOptionLabel,
                    {
                      color: tokens.textPrimary,
                      fontFamily: isSelected
                        ? FontFamily.bold
                        : FontFamily.medium,
                    },
                  ]}
                >
                  {translate(`common.languages.${lang.code}`)}
                </Text>
                {isSavingLang && isSelected ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <MaterialIcons
                    name={isSelected ? "check-circle" : "radio-button-unchecked"}
                    size={22}
                    color={isSelected ? Colors.primary : tokens.textPlaceholder}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetModal>

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
                      : tokens.borderDefault,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleTextSizeSelect(preset)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={PRESET_ICONS[preset]}
                  size={22}
                  color={isSelected ? Colors.primary : tokens.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.modalOptionLabel,
                      {
                        color: isSelected ? Colors.primary : tokens.textPrimary,
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
                      { color: tokens.textSecondary },
                    ]}
                  >
                    {translate(`textSize.descriptions.${preset}`)}
                  </Text>
                </View>
                <MaterialIcons
                  name={isSelected ? "check-circle" : "radio-button-unchecked"}
                  size={22}
                  color={isSelected ? Colors.primary : tokens.textPlaceholder}
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
});
