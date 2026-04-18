import { tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MapPromoBanner() {
  const t = tokens;
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: t.primaryLight,
          borderColor: t.primary + "1A",
        },
      ]}
      activeOpacity={0.8}
      onPress={() => router.push("/(tabs)/search")}
    >
      <View style={[styles.iconBox, { backgroundColor: t.primary }]}>
        <MaterialIcons name="map" size={22} color="#fff" />
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          Haritada Gör
        </Text>
        <Text style={[styles.subtitle, { color: t.textTertiary }]}>
          Yakınındaki depoları keşfet
        </Text>
      </View>

      <MaterialIcons name="arrow-forward-ios" size={16} color={t.secondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
