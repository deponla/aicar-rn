import { tokens } from "@/constants/theme";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HomeHeaderProps {
  readonly locationGranted: boolean;
  readonly onRequestLocation: () => void;
}

export default function HomeHeader({
  locationGranted,
  onRequestLocation,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const t = tokens;
  const router = useRouter();
  const { user, status } = useAuthStore();
  const isLoggedIn = status === AuthStatusEnum.LOGGED_IN;

  const userName = isLoggedIn ? user?.user?.name : undefined;
  const userPhoto = isLoggedIn ? user?.user?.photo : undefined;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          backgroundColor: t.bgSurface,
          borderBottomColor: t.borderSubtle,
        },
      ]}
    >
      {/* Top Row: Avatar + Location + Notification */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.avatarRow}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/profile")}
        >
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.avatar} />
          ) : (
            <Image
              source={require("@/assets/images/logo.jpg")}
              style={styles.avatar}
            />
          )}
          <View style={styles.locationCol}>
            <Text style={[styles.locationLabel, { color: t.textTertiary }]}>
              {isLoggedIn && userName ? `Merhaba, ${userName}` : "Hoş geldin"}
            </Text>
            {locationGranted ? (
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={14} color={t.success} />
                <Text
                  style={[styles.locationText, { color: t.textPrimary }]}
                  numberOfLines={1}
                >
                  Konumunuz aktif
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationRow}
                activeOpacity={0.7}
                onPress={onRequestLocation}
              >
                <MaterialIcons
                  name="location-off"
                  size={14}
                  color={t.warning}
                />
                <Text
                  style={[styles.locationText, { color: t.warning }]}
                  numberOfLines={1}
                >
                  Konum izni gerekli
                </Text>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={10}
                  color={t.warning}
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.notifButton, { backgroundColor: t.bgSubtle }]}
          activeOpacity={0.7}
          onPress={() => router.push("/notifications")}
        >
          <MaterialIcons
            name="notifications-none"
            size={24}
            color={t.textSecondary}
          />
          <View style={[styles.notifDot, { borderColor: t.bgSurface }]} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  locationCol: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "700",
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7F50",
    borderWidth: 1.5,
  },
});
