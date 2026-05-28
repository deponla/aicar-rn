import {
  MenuCard,
  SectionLabel,
  SettingsMenuItem,
} from "@/components/ProfileSettingsMenu";
import ScreenContainer from "@/components/ScreenContainer";
import { FontFamily, tokens } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuth";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const { t: translate } = useTranslation();
  const user = useAuthStore((state) => state.user?.user);
  const router = useRouter();

  const goToEditProfile = useCallback(() => {
    router.push("/profile/edit-profile");
  }, [router]);

  const goToPhoneNumber = useCallback(() => {
    router.push("/profile/phone-number");
  }, [router]);

  const goToEmailAddress = useCallback(() => {
    router.push("/profile/email-address");
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

  return (
    <ScreenContainer
      title={translate("settings.title")}
      showBackButton
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: tokens.bgBase },
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
