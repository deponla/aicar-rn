import HamburgerDrawer from "@/components/HamburgerDrawer";
import { Colors, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <>
      <NativeTabs
        backgroundColor="rgba(255,255,255,0.72)"
        blurEffect="systemChromeMaterialLight"
        iconColor={{
          default: tokens.textTertiary,
          selected: Colors.primary,
        }}
        labelVisibilityMode="unlabeled"
        minimizeBehavior={Platform.OS === "ios" ? "onScrollDown" : undefined}
        shadowColor="rgba(13,28,50,0.14)"
        tintColor={Colors.primary}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label hidden>
            {t("tabs.scanner")}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="viewfinder"
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="center-focus-strong" />}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Label hidden>
            {t("tabs.garage")}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "car", selected: "car.fill" }}
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="directions-car" />}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="insights">
          <NativeTabs.Trigger.Label hidden>
            {t("tabs.insights")}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "doc.text", selected: "doc.text.fill" }}
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="article" />}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label hidden>
            {t("tabs.settings")}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="settings" />}
          />
        </NativeTabs.Trigger>
      </NativeTabs>

      <HamburgerDrawer />
    </>
  );
}
