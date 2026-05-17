import { HapticTab } from "@/components/haptic-tab";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t: translate } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: tokens.textTertiary,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
          borderTopWidth: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          backgroundColor: Platform.OS === "ios" ? "transparent" : "rgba(251,249,251,0.92)",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="systemChromeMaterialLight"
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  overflow: "hidden",
                },
              ]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: 12,
          lineHeight: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translate("tabs.scanner"),
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <View style={tabStyles.activeTab}>
                <MaterialIcons name="center-focus-strong" size={22} color={tokens.textInverse} />
              </View>
            ) : (
              <MaterialIcons name="center-focus-strong" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: translate("tabs.garage"),
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <View style={tabStyles.activeTab}>
                <MaterialIcons name="directions-car" size={22} color={tokens.textInverse} />
              </View>
            ) : (
              <MaterialIcons name="directions-car" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: translate("tabs.insights"),
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <View style={tabStyles.activeTab}>
                <MaterialIcons name="bar-chart" size={22} color={tokens.textInverse} />
              </View>
            ) : (
              <MaterialIcons name="bar-chart" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translate("tabs.settings"),
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <View style={tabStyles.activeTab}>
                <MaterialIcons name="settings" size={22} color={tokens.textInverse} />
              </View>
            ) : (
              <MaterialIcons name="settings" size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  activeTab: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 6,
    ...ambientShadow,
  },
});
