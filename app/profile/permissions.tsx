import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { syncPermissions } from "@/utils/deviceRegistration";
import type { PermissionStatus } from "@/types/device";

interface PermissionCardProps {
  label: string;
  description: string;
  granted: boolean;
  onPress: () => void;
}

function PermissionCard({
  label,
  description,
  granted,
  onPress,
}: PermissionCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.bgSurface,
          borderColor: granted ? tokens.success + "30" : tokens.borderDefault,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardLabel, { color: tokens.textPrimary }]}>
          {label}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: granted ? tokens.successBg : tokens.bgSubtle,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: granted
                  ? tokens.success
                  : tokens.textPlaceholder,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: granted ? tokens.successText : tokens.textTertiary,
              },
            ]}
          >
            {granted ? "Aktif" : "Kapalı"}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardDesc, { color: tokens.textSecondary }]}>
        {description}
      </Text>

      <TouchableOpacity
        style={[
          styles.cardButton,
          granted
            ? {
              backgroundColor: tokens.bgSubtle,
              borderColor: tokens.borderDefault,
              borderWidth: 1,
            }
            : { backgroundColor: Colors.primary },
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Text
          style={[
            styles.cardButtonText,
            { color: granted ? tokens.textSecondary : "#fff" },
          ]}
        >
          {granted ? "Ayarları Yönet" : "İzin Ver"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function openAppSettings() {
  if (Platform.OS === "ios") {
    Linking.openURL("app-settings:");
  } else {
    Linking.openSettings();
  }
}

function toPermissionStatus(status: string): PermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export default function PermissionsScreen() {
  const [locationGranted, setLocationGranted] = useState(false);
  const [photosGranted, setPhotosGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const checkPermissions = useCallback(async () => {
    const [loc, photos, notif] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
      Notifications.getPermissionsAsync(),
    ]);
    setLocationGranted(loc.status === "granted");
    setPhotosGranted(photos.status === "granted");
    setNotificationsGranted(notif.status === "granted");

    // Mevcut durumu backend'e sync et
    syncPermissions({
      location: toPermissionStatus(loc.status),
      mediaLibrary: toPermissionStatus(photos.status),
      notifications: toPermissionStatus(notif.status),
    });
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleLocation = useCallback(async () => {
    if (locationGranted) {
      openAppSettings();
      return;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === "granted";
    setLocationGranted(granted);
    if (!granted) openAppSettings();
    syncPermissions({ location: toPermissionStatus(status) });
  }, [locationGranted]);

  const handlePhotos = useCallback(async () => {
    if (photosGranted) {
      openAppSettings();
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const granted = status === "granted";
    setPhotosGranted(granted);
    if (!granted) openAppSettings();
    syncPermissions({ mediaLibrary: toPermissionStatus(status) });
  }, [photosGranted]);

  const handleNotifications = useCallback(async () => {
    if (notificationsGranted) {
      openAppSettings();
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setNotificationsGranted(granted);
    if (!granted) openAppSettings();
    syncPermissions({ notifications: toPermissionStatus(status) });
  }, [notificationsGranted]);

  return (
    <ScreenContainer title="İzinler" showBackButton>
      <View style={styles.cardsContainer}>
        <PermissionCard
          label="Bildirimler"
          description="Rezervasyon güncellemeleri ve önemli bildirimleri almak için kullanılır"
          granted={notificationsGranted}
          onPress={handleNotifications}
        />
        <PermissionCard
          label="Konum"
          description="Yakınındaki depoları göstermek için kullanılır"
          granted={locationGranted}
          onPress={handleLocation}
        />
        <PermissionCard
          label="Fotoğraf Galerisi"
          description="Depo ilanlarına fotoğraf eklemek için kullanılır"
          granted={photosGranted}
          onPress={handlePhotos}
        />
      </View>

      <TouchableOpacity
        style={styles.footer}
        activeOpacity={0.6}
        onPress={openAppSettings}
      >
        <Text style={[styles.footerText, { color: tokens.textTertiary }]}>
          Tüm izinleri cihaz ayarlarından da yönetebilirsiniz.
        </Text>
        <Text style={[styles.footerLink, { color: Colors.primary }]}>
          Ayarları Aç
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryText: {
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryCount: {
    fontWeight: "700",
    fontSize: 15,
  },
  cardsContainer: {
    gap: 12,
    paddingTop: 8,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
