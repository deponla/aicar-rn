import { FontFamily, tokens } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuth";
import { useCreditsStore } from "@/store/useCredits";
import { AuthStatusEnum } from "@/types/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const isLoggedIn = status === AuthStatusEnum.LOGGED_IN;
  const userPhoto = isLoggedIn ? user?.user?.photo : undefined;

  const headerContent = (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.left}>
        <TouchableOpacity
          onPress={onMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          style={styles.menuButton}
        >
          <MaterialIcons name="menu" size={24} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>AutoSense AI</Text>
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
              {credits.remaining} Kredi
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

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={80}
        tint="systemChromeMaterialLight"
        style={styles.blurWrap}
      >
        {headerContent}
      </BlurView>
    );
  }

  return (
    <View style={[styles.blurWrap, styles.androidBg]}>
      {headerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  blurWrap: {
    zIndex: 40,
  },
  androidBg: {
    backgroundColor: "rgba(251,249,251,0.85)",
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
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: tokens.textPrimary,
    letterSpacing: -0.22,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
