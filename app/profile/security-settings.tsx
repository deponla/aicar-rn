import {
  MenuCard,
  SectionLabel,
  SettingsMenuItem,
} from "@/components/ProfileSettingsMenu";
import ScreenContainer from "@/components/ScreenContainer";
import { FontFamily, tokens } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuth";
import { getSettingsItemLabel } from "@/utils/settingsLabels";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export default function SecuritySettingsScreen() {
  const { t: translate, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user?.user);
  const router = useRouter();
  const title = getSettingsItemLabel(
    translate,
    "security",
    i18n.resolvedLanguage || i18n.language,
  );

  const goToChangePassword = useCallback(() => {
    router.push("/profile/change-password");
  }, [router]);

  const goToActiveSessions = useCallback(() => {
    router.push("/profile/active-sessions");
  }, [router]);

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

  const isLocalAuth = user.authProvider === "local";

  return (
    <ScreenContainer
      title={title}
      showBackButton
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: tokens.bgBase },
      ]}
    >
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
          showDivider={false}
        />
      </MenuCard>
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
});
