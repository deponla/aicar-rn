import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import {
  useConfirmUpload,
  useDeletePhoto,
  usePatchUsers,
  useUploadUrl,
} from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export default function EditProfileScreen() {
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const router = useRouter();
  const { notify } = useNotification();
  const { t } = useTranslation();
  const patchUser = usePatchUsers();
  const uploadUrl = useUploadUrl();
  const confirmUpload = useConfirmUpload();
  const deletePhotoMutation = useDeletePhoto();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (user) {
      const frame = requestAnimationFrame(() => {
        setName(user.name || "");
        setSurname(user.surname || "");
        setPhone(user.phone || "");
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }
  }, [user]);

  const getInitials = () => {
    const n = user?.name || "";
    const s = user?.surname || "";
    return `${n.charAt(0)}${s.charAt(0)}`.toUpperCase() || "?";
  };

  const hasChanges =
    name !== (user?.name || "") ||
    surname !== (user?.surname || "") ||
    phone !== (user?.phone || "");

  const isValid = name.trim().length > 0 && surname.trim().length > 0;

  const handleSave = async () => {
    if (!user?.id || !isValid) return;

    try {
      await patchUser.mutateAsync({
        id: user.id,
        d: {
          name: name.trim(),
          surname: surname.trim(),
          phone: phone.trim(),
        },
      });

      mergeAuthenticatedUser({
        name: name.trim(),
        surname: surname.trim(),
        phone: phone.trim(),
      });

      notify({
        type: "success",
        title: t("editProfileScreen.saveSuccessTitle"),
      });
      router.back();
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("editProfileScreen.saveErrorMessage"),
        notify,
        title: t("editProfileScreen.saveErrorTitle"),
      });
    }
  };

  const pickAndUploadImage = async (source: "camera" | "library") => {
    try {
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      };

      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          notify({
            type: "error",
            title: t("scanScreen.alerts.permissionRequiredTitle"),
            message: t("scanScreen.alerts.cameraPermissionMessage"),
          });
          return;
        }
        result = await ImagePicker.launchCameraAsync(pickerOptions);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== "granted") {
          notify({
            type: "error",
            title: t("scanScreen.alerts.permissionRequiredTitle"),
            message: t("scanScreen.alerts.galleryPermissionMessage"),
          });
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      }

      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];

      setIsUploadingPhoto(true);

      const { result: uploadData } = await uploadUrl.mutateAsync();

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || "photo.jpg",
      } as unknown as Blob);

      await axios.post(uploadData.url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { result: confirmResult } = await confirmUpload.mutateAsync({
        id: uploadData.id,
        userId: user!.id,
      });

      mergeAuthenticatedUser({ photo: confirmResult.photo });

      notify({ type: "success", title: t("editProfileScreen.photoUpdated") });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("editProfileScreen.photoUploadFailedMessage"),
        notify,
        title: t("editProfileScreen.photoUploadFailedTitle"),
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.photo) return;

    const photoId = user.photo.split("/").pop() || "";
    try {
      setIsUploadingPhoto(true);
      await deletePhotoMutation.mutateAsync({
        id: photoId,
        userId: user.id,
      });

      mergeAuthenticatedUser({ photo: null });

      notify({ type: "success", title: t("editProfileScreen.photoDeleted") });
    } catch (error: unknown) {
      notifyApiError({
        error,
        fallbackMessage: t("editProfileScreen.photoDeleteFailedMessage"),
        notify,
        title: t("editProfileScreen.photoDeleteFailedTitle"),
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    const takePhotoLabel = t("editProfileScreen.photoOptions.takePhoto");
    const chooseFromGalleryLabel = t("editProfileScreen.photoOptions.chooseFromGallery");
    const deletePhotoLabel = t("editProfileScreen.photoOptions.deletePhoto");
    const cancelLabel = t("editProfileScreen.photoOptions.cancel");
    const options = user?.photo
      ? [takePhotoLabel, chooseFromGalleryLabel, deletePhotoLabel, cancelLabel]
      : [takePhotoLabel, chooseFromGalleryLabel, cancelLabel];
    const cancelIndex = options.length - 1;
    const destructiveIndex = user?.photo ? 2 : undefined;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        (index) => {
          if (index === 0) pickAndUploadImage("camera");
          else if (index === 1) pickAndUploadImage("library");
          else if (index === 2 && user?.photo) handleDeletePhoto();
        },
      );
    } else {
      Alert.alert(t("editProfileScreen.photoOptions.title"), t("editProfileScreen.photoOptions.message"), [
        { text: takePhotoLabel, onPress: () => pickAndUploadImage("camera") },
        {
          text: chooseFromGalleryLabel,
          onPress: () => pickAndUploadImage("library"),
        },
        ...(user?.photo
          ? [
            {
              text: deletePhotoLabel,
              style: "destructive" as const,
              onPress: handleDeletePhoto,
            },
          ]
          : []),
        { text: cancelLabel, style: "cancel" as const },
      ]);
    }
  };

  if (!user) {
    return (
      <ScreenContainer title={t("editProfileScreen.title")} showBackButton>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
          <Text style={styles.emptyText}>{t("settings.noUser")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={t("editProfileScreen.title")}
      showBackButton
      headerRight={
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || !isValid || patchUser.isPending}
          activeOpacity={0.7}
          style={[
            styles.saveHeaderBtn,
            (!hasChanges || !isValid) && styles.saveHeaderBtnDisabled,
          ]}
        >
          {patchUser.isPending ? (
            <ActivityIndicator size="small" color={tokens.textInverse} />
          ) : (
            <Text
              style={[
                styles.saveHeaderBtnText,
                (!hasChanges || !isValid) && styles.saveHeaderBtnTextDisabled,
              ]}
            >
              {t("editProfileScreen.saveHeader")}
            </Text>
          )}
        </TouchableOpacity>
      }
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={showPhotoOptions}
            activeOpacity={0.7}
            disabled={isUploadingPhoto}
            style={styles.avatarTouchable}
          >
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            {isUploadingPhoto ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color={tokens.textInverse} />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <MaterialIcons name="camera-alt" size={14} color={tokens.textInverse} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            {t("editProfileScreen.avatarHint")}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>{t("editProfileScreen.personalInfoTitle")}</Text>
          </View>
          <View style={styles.cardDivider} />

          <View style={styles.cardBody}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("editProfileScreen.fields.name.label")}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t("editProfileScreen.fields.name.placeholder")}
                placeholderTextColor={tokens.textPlaceholder}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {name.length === 0 && (
                <Text style={styles.errorText}>{t("editProfileScreen.fields.name.required")}</Text>
              )}
            </View>

            {/* Surname */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("editProfileScreen.fields.surname.label")}</Text>
              <TextInput
                style={styles.input}
                value={surname}
                onChangeText={setSurname}
                placeholder={t("editProfileScreen.fields.surname.placeholder")}
                placeholderTextColor={tokens.textPlaceholder}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {surname.length === 0 && (
                <Text style={styles.errorText}>{t("editProfileScreen.fields.surname.required")}</Text>
              )}
            </View>

            {/* Email (read-only) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("editProfileScreen.fields.email.label")}</Text>
              <View style={styles.readOnlyField}>
                <MaterialIcons name="lock" size={16} color={tokens.textPlaceholder} />
                <Text style={styles.readOnlyText}>{user.email}</Text>
              </View>
              <Text style={styles.helperText}>
                {t("editProfileScreen.fields.email.helper")}
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("editProfileScreen.fields.phone.label")}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder={t("editProfileScreen.fields.phone.placeholder")}
                placeholderTextColor={tokens.textPlaceholder}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || !isValid || patchUser.isPending) &&
            styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || !isValid || patchUser.isPending}
          activeOpacity={0.8}
        >
          {patchUser.isPending ? (
            <ActivityIndicator size="small" color={tokens.textInverse} />
          ) : (
            <>
              <MaterialIcons name="check" size={20} color={tokens.textInverse} />
              <Text style={styles.saveButtonText}>{t("editProfileScreen.saveButton")}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>{t("editProfileScreen.cancel")}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: tokens.textTertiary,
  },

  // Save Header Button
  saveHeaderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  saveHeaderBtnDisabled: {
    backgroundColor: tokens.borderSubtle,
  },
  saveHeaderBtnText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textInverse,
    fontSize: 14,
  },
  saveHeaderBtnTextDisabled: {
    color: tokens.textTertiary,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: tokens.surfaceContainer,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: tokens.surfaceContainer,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    color: tokens.textInverse,
    fontSize: 34,
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: tokens.surfaceContainerLowest,
  },
  avatarHint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: tokens.textTertiary,
    textAlign: "center",
  },

  // Card
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    marginBottom: 24,
    ...ambientShadow,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: tokens.borderSubtle,
    marginHorizontal: 20,
  },
  cardBody: {
    padding: 20,
    gap: 20,
  },

  // Fields
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: tokens.textPrimary,
    marginBottom: 2,
  },
  input: {
    backgroundColor: tokens.surfaceContainerLow,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: tokens.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textSecondary,
    flex: 1,
  },
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: tokens.textTertiary,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: tokens.danger,
  },

  // Save Button
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 9999,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: tokens.textPlaceholder,
  },
  saveButtonText: {
    fontFamily: FontFamily.bold,
    color: tokens.textInverse,
    fontSize: 16,
  },

  // Cancel
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    backgroundColor: tokens.surfaceContainerLowest,
  },
  cancelButtonText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textPrimary,
    fontSize: 16,
  },
});
