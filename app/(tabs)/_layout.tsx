import HamburgerDrawer from "@/components/HamburgerDrawer";
import { Colors, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
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
          <NativeTabs.Trigger.Label hidden>Scanner</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf="viewfinder"
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="center-focus-strong" />}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Label hidden>Garage</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "car", selected: "car.fill" }}
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="directions-car" />}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="insights">
          <NativeTabs.Trigger.Label hidden>Insights</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "doc.text", selected: "doc.text.fill" }}
            src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="article" />}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Label hidden>Settings</NativeTabs.Trigger.Label>
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
