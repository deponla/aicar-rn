import { FontFamily, tokens } from "@/constants/theme";
import LiquidGlassView from "@/components/LiquidGlassView";
import { useAuthStore } from "@/store/useAuth";
import { useCreditsStore } from "@/store/useCredits";
import { useHamburgerDrawerStore } from "@/store/useHamburgerDrawer";
import { AuthStatusEnum } from "@/types/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  readonly onMenuPress?: () => void;
}

export default function HomeHeader({
  onMenuPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, status } = useAuthStore();
  const credits = useCreditsStore((s) => s.credits);
  const toggleDrawer = useHamburgerDrawerStore((state) => state.toggle);
  const isLoggedIn = status === AuthStatusEnum.LOGGED_IN;
  const userPhoto = isLoggedIn ? user?.user?.photo : undefined;
  const handleMenuPress = onMenuPress ?? toggleDrawer;
  const { t } = useTranslation();

  const headerContent = (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.left}>
        <TouchableOpacity
          onPress={handleMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          style={styles.menuButton}
        >
          <MaterialIcons name="menu" size={24} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>AutoLensly</Text>
      </View>

      <View style={styles.right}>
        {isLoggedIn && credits ? (
          <TouchableOpacity
            style={styles.creditBadge}
            activeOpacity={0.8}
            onPress={() => router.push("/credits")}
          >
            <MaterialIcons name="auto-awesome" size={16} color={tokens.secondaryFixedDim} />
            <Text style={styles.creditText}>
              {credits.remaining} {t("credits.balanceUnit")}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.avatarButton}
        >
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={20} color={tokens.textTertiary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LiquidGlassView
      glassStyle="regular"
      tintColor={tokens.glassTint}
      style={styles.blurWrap}
      contentStyle={styles.glassContent}
    >
      {headerContent}
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  blurWrap: {
    zIndex: 40,
    borderBottomWidth: 1,
    borderBottomColor: tokens.glassStrokeMuted,
  },
  glassContent: {
    flex: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
    minHeight: 48,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    borderRadius: 9999,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    flexShrink: 1,
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: tokens.textPrimary,
    letterSpacing: -0.22,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  avatarButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: tokens.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  creditText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textInverse,
    letterSpacing: 0.7,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
    overflow: "hidden",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
});
