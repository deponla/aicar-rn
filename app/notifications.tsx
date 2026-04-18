import ScreenContainer from "@/components/ScreenContainer";
import { tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NotificationsScreen() {
  const t = tokens;

  return (
    <ScreenContainer title="Bildirimler" showBackButton>
      <View style={styles.emptyContainer}>
        <MaterialIcons
          name="notifications-none"
          size={64}
          color={t.textPlaceholder}
        />
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
          Henüz bildiriminiz yok
        </Text>
        <Text style={[styles.emptyMessage, { color: t.textTertiary }]}>
          Yeni ilanlar, mesajlar ve fırsatlar hakkında bildirimler burada
          görünecek.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
