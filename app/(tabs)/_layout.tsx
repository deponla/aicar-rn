import { HapticTab } from "@/components/haptic-tab";
import HamburgerDrawer from "@/components/HamburgerDrawer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

type TabIconName = React.ComponentProps<typeof MaterialIcons>["name"];

function TabBarIcon({
  color,
  focused,
  name,
}: {
  color: React.ComponentProps<typeof MaterialIcons>["color"];
  focused: boolean;
  name: TabIconName;
}) {
  return (
    <View style={[tabStyles.iconSlot, focused && tabStyles.iconSlotActive]}>
      <MaterialIcons
        name={name}
        size={24}
        color={focused ? tokens.textInverse : color}
      />
    </View>
  );
}

export default function TabLayout() {
  const { t: translate } = useTranslation();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: (props) => <HapticTab {...props} />,
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
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                name="center-focus-strong"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: translate("tabs.garage"),
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                color={color}
                focused={focused}
                name="directions-car"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: translate("tabs.insights"),
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon color={color} focused={focused} name="bar-chart" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: translate("tabs.settings"),
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon color={color} focused={focused} name="settings" />
            ),
          }}
        />
      </Tabs>

      <HamburgerDrawer />
    </>
  );
}

const tabStyles = StyleSheet.create({
  iconSlot: {
    width: 52,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  iconSlotActive: {
    backgroundColor: Colors.primary,
    ...ambientShadow,
  },
});
