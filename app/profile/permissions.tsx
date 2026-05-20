import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tokens.surfaceContainerLowest,
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
            {granted
              ? t("permissionsScreen.status.active")
              : t("permissionsScreen.status.inactive")}
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
            { color: granted ? tokens.textSecondary : tokens.textInverse },
          ]}
        >
          {granted
            ? t("permissionsScreen.actions.manage")
            : t("permissionsScreen.actions.allow")}
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
  const { t } = useTranslation();
  const [cameraGranted, setCameraGranted] = useState(false);
  const [photosGranted, setPhotosGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  const checkPermissions = useCallback(async () => {
    const [camera, photos, notif] = await Promise.all([
      ImagePicker.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
      Notifications.getPermissionsAsync(),
    ]);
    setCameraGranted(camera.status === "granted");
    setPhotosGranted(photos.status === "granted");
    setNotificationsGranted(notif.status === "granted");

    // Mevcut durumu backend'e sync et
    syncPermissions({
      camera: toPermissionStatus(camera.status),
      mediaLibrary: toPermissionStatus(photos.status),
      notifications: toPermissionStatus(notif.status),
    });
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void checkPermissions();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [checkPermissions]);

  const handleCamera = useCallback(async () => {
    if (cameraGranted) {
      openAppSettings();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    const granted = status === "granted";
    setCameraGranted(granted);
    if (!granted) openAppSettings();
    syncPermissions({ camera: toPermissionStatus(status) });
  }, [cameraGranted]);

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
    const perms = await Notifications.requestPermissionsAsync() as unknown as { status: string };
    const granted = perms.status === 'granted';
    setNotificationsGranted(granted);
    if (!granted) openAppSettings();
    syncPermissions({ notifications: toPermissionStatus(perms.status) });
  }, [notificationsGranted]);

  return (
    <ScreenContainer title={t("profileScreen.permissions")} showBackButton>
      <View style={styles.cardsContainer}>
        <PermissionCard
          label={t("permissionsScreen.cards.notifications.label")}
          description={t("permissionsScreen.cards.notifications.description")}
          granted={notificationsGranted}
          onPress={handleNotifications}
        />
        <PermissionCard
          label={t("permissionsScreen.cards.camera.label")}
          description={t("permissionsScreen.cards.camera.description")}
          granted={cameraGranted}
          onPress={handleCamera}
        />
        <PermissionCard
          label={t("permissionsScreen.cards.media.label")}
          description={t("permissionsScreen.cards.media.description")}
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
          {t("permissionsScreen.footer.description")}
        </Text>
        <Text style={[styles.footerLink, { color: Colors.primary }]}>
          {t("permissionsScreen.footer.openSettings")}
        </Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryCount: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  cardsContainer: {
    gap: 12,
    paddingTop: 8,
    marginHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    ...ambientShadow,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
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
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
  },
  cardDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  cardButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 9999,
  },
  cardButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 16,
    gap: 6,
  },
  footerText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
});
