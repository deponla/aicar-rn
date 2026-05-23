import { Colors, tokens, FontFamily, ambientShadow } from "@/constants/theme";
import CarBrandModelFields from "@/components/CarBrandModelFields";
import CarPhotoGrid from "@/components/CarPhotoGrid";
import HomeHeader from "@/components/HomeHeader";
import LoginRequired from "@/components/LoginRequired";
import { useNotification } from "@/components/Notification";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { Car, CreateCarRequest, FuelTypeEnum, TransmissionEnum } from "@/types/car";
import { AnalyzeMediaLog, AiUrgency } from "@/types/ai";
import {
  useCarUploadUrl,
  useConfirmCarPhoto,
  useGetCars,
  useCreateCar,
  useDeleteCar,
} from "@/query-hooks/useCars";
import { useGetAnalysisLogs } from "@/query-hooks/useAnalysisLogs";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import dayjs from "dayjs";
import { Href, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useTranslation } from "react-i18next";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FUEL_LABEL_KEYS: Record<FuelTypeEnum, string> = {
  [FuelTypeEnum.GASOLINE]: "carDetail.fuel.gasoline",
  [FuelTypeEnum.DIESEL]: "carDetail.fuel.diesel",
  [FuelTypeEnum.LPG]: "carDetail.fuel.lpg",
  [FuelTypeEnum.ELECTRIC]: "carDetail.fuel.electric",
  [FuelTypeEnum.HYBRID]: "carDetail.fuel.hybrid",
};

const TRANSMISSION_LABEL_KEYS: Record<TransmissionEnum, string> = {
  [TransmissionEnum.MANUAL]: "carDetail.transmission.manual",
  [TransmissionEnum.AUTOMATIC]: "carDetail.transmission.automatic",
};

const FUEL_OPTIONS = Object.values(FuelTypeEnum);
const TRANSMISSION_OPTIONS = Object.values(TransmissionEnum);
const MAX_CAR_PHOTOS = 5;

type PendingCarPhoto = {
  uri: string;
  mimeType?: string;
  fileName?: string;
};

function getFuelLabel(fuelType: FuelTypeEnum, t: (key: string) => string) {
  return t(FUEL_LABEL_KEYS[fuelType]);
}

function getTransmissionLabel(
  transmission: TransmissionEnum,
  t: (key: string) => string,
) {
  return t(TRANSMISSION_LABEL_KEYS[transmission]);
}

function urgencyIcon(urgency?: AiUrgency): { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string } {
  switch (urgency) {
    case "critical":
      return { name: "warning", bg: tokens.dangerBg, color: tokens.danger };
    case "warning":
      return { name: "error-outline", bg: tokens.warningBg, color: tokens.warning };
    default:
      return { name: "check-circle", bg: tokens.primaryLight, color: Colors.primary };
  }
}

function urgencyBadgeIcon(urgency?: AiUrgency): { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string } {
  switch (urgency) {
    case "critical":
      return { name: "error", bg: tokens.dangerBg, color: tokens.danger };
    case "warning":
      return { name: "flash-on", bg: tokens.warningBg, color: tokens.warning };
    default:
      return { name: "check", bg: tokens.primaryLight, color: Colors.primary };
  }
}

const ScanHistoryItem = React.memo(function ScanHistoryItem({
  item,
  onPress,
}: {
  item: AnalyzeMediaLog;
  onPress: (item: AnalyzeMediaLog) => void;
}) {
  const urgency = item.aiResponse?.urgency;
  const iconInfo = urgencyIcon(urgency);
  const badgeInfo = urgencyBadgeIcon(urgency);

  return (
    <TouchableOpacity
      style={styles.scanItem}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.scanItemIcon, { backgroundColor: iconInfo.bg }]}>
        <MaterialIcons name={iconInfo.name} size={20} color={iconInfo.color} />
      </View>
      <View style={styles.scanItemContent}>
        <Text style={styles.scanItemTitle} numberOfLines={1}>
          {item.aiResponse?.title ?? item.analysisType}
        </Text>
        <Text style={styles.scanItemDate}>
          {dayjs(item.createdAt).format("DD MMM YYYY • HH:mm")}
        </Text>
      </View>
      <View style={[styles.scanItemBadge, { backgroundColor: badgeInfo.bg }]}>
        <MaterialIcons name={badgeInfo.name} size={16} color={badgeInfo.color} />
      </View>
    </TouchableOpacity>
  );
});

const CarHeroCard = React.memo(function CarHeroCard({
  item,
  onPress,
  onDelete,
}: {
  item: Car;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.heroCard}
      onPress={() => onPress(item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.heroCardInner}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>
              {item.year} {item.brand} {item.model}
            </Text>
            <Text style={styles.heroSubtitle}>
              {item.fuelType ? getFuelLabel(item.fuelType, t) : ""}{item.transmission ? ` • ${getTransmissionLabel(item.transmission, t)}` : ""}
              {item.engineCC ? ` • ${item.engineCC} cc` : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.heroDeleteBtn}
          >
            <MaterialIcons name="delete-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>
      {item.currentMileage != null ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t("garageScreen.odometerLabel")}</Text>
            <Text style={styles.statValue}>{item.currentMileage.toLocaleString()} km</Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

const AddCarComposer = React.memo(function AddCarComposer({
  onClose,
  onSubmit,
  isLoading,
  isPhotoBusy,
  bottomInset,
}: {
  onClose: () => void;
  onSubmit: (data: CreateCarRequest, photos: PendingCarPhoto[]) => void;
  isLoading: boolean;
  isPhotoBusy: boolean;
  bottomInset: number;
}) {
  const { t } = useTranslation();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState<FuelTypeEnum | undefined>();
  const [transmission, setTransmission] = useState<
    TransmissionEnum | undefined
  >();
  const [engineCC, setEngineCC] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [nickname, setNickname] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>();
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingCarPhoto[]>([]);

  const parsedYear = parseInt(year, 10);
  const submitDisabled =
    isLoading || !brand.trim() || !model.trim() || Number.isNaN(parsedYear);

  const previewTitle = useMemo(() => {
    const title = [brand.trim(), model.trim()].filter(Boolean).join(" ");
    if (!title && !year.trim()) {
      return t("garageScreen.addCar.previewFallback");
    }

    return [year.trim(), title].filter(Boolean).join(" ");
  }, [brand, model, t, year]);

  const normalizedLicensePlate = useMemo(
    () => licensePlate.trim().replace(/\s+/g, " ").toUpperCase(),
    [licensePlate],
  );

  const purchaseDateValue = useMemo(() => {
    if (!purchaseDate) {
      return new Date();
    }

    return new Date(purchaseDate);
  }, [purchaseDate]);

  const formattedPurchaseDate = purchaseDate
    ? dayjs(purchaseDate).format("DD.MM.YYYY")
    : t("carDetail.purchaseDatePlaceholder");

  const handlePurchaseDateChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === "android") {
        setShowPurchaseDatePicker(false);
      }

      if (event.type === "dismissed" || !selectedDate) {
        return;
      }

      setPurchaseDate(dayjs(selectedDate).format("YYYY-MM-DD"));
    },
    [],
  );

  const pickCarPhoto = useCallback(
    async (source: "camera" | "library") => {
      try {
        if (pendingPhotos.length >= MAX_CAR_PHOTOS) {
          return;
        }

        const pickerOptions: ImagePicker.ImagePickerOptions = {
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        };

        let result: ImagePicker.ImagePickerResult;
        if (source === "camera") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.status !== "granted") {
            return;
          }
          result = await ImagePicker.launchCameraAsync(pickerOptions);
        } else {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.status !== "granted") {
            return;
          }
          result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
        }

        if (result.canceled || !result.assets[0]) {
          return;
        }

        const asset = result.assets[0];
        setPendingPhotos((current) =>
          current.length >= MAX_CAR_PHOTOS
            ? current
            : [
              ...current,
              {
                uri: asset.uri,
                mimeType: asset.mimeType,
                fileName: asset.fileName ?? undefined,
              },
            ],
        );
      } catch {
        // silently ignore pick errors
      }
    },
    [pendingPhotos.length],
  );

  const openPhotoPicker = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t("carDetail.cancel"),
            t("garageScreen.addCar.takePhotoAction"),
            t("garageScreen.addCar.chooseFromGalleryAction"),
          ],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void pickCarPhoto("camera");
          if (index === 2) void pickCarPhoto("library");
        },
      );
      return;
    }

    Alert.alert(
      t("garageScreen.addCar.photoSourceTitle"),
      undefined,
      [
        { text: t("carDetail.cancel"), style: "cancel" },
        {
          text: t("garageScreen.addCar.takePhotoAction"),
          onPress: () => void pickCarPhoto("camera"),
        },
        {
          text: t("garageScreen.addCar.chooseFromGalleryAction"),
          onPress: () => void pickCarPhoto("library"),
        },
      ],
    );
  }, [pickCarPhoto, t]);

  const removePendingPhoto = useCallback((uri: string) => {
    setPendingPhotos((current) => current.filter((photo) => photo.uri !== uri));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!brand.trim() || !model.trim() || Number.isNaN(parsedYear)) {
      return;
    }

    onSubmit(
      {
        brand: brand.trim(),
        model: model.trim(),
        year: parsedYear,
        fuelType,
        transmission,
        engineCC: engineCC ? parseInt(engineCC, 10) : undefined,
        currentMileage: currentMileage ? parseInt(currentMileage, 10) : undefined,
        nickname: nickname.trim() || undefined,
        licensePlate: normalizedLicensePlate || undefined,
        color: color.trim() || undefined,
        notes: notes.trim() || undefined,
        purchaseDate,
      },
      pendingPhotos,
    );
  }, [
    brand,
    color,
    currentMileage,
    engineCC,
    fuelType,
    model,
    nickname,
    normalizedLicensePlate,
    notes,
    onSubmit,
    pendingPhotos,
    parsedYear,
    purchaseDate,
    transmission,
  ]);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.addComposerContainer}>
      <View style={styles.addComposerHeader}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.addComposerHeaderButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={22} color={tokens.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={styles.addComposerHeaderTextButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.addComposerHeaderText}>{t("carDetail.cancel")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.addComposerScroll}
        contentContainerStyle={[
          styles.addComposerContent,
          { paddingBottom: bottomInset + 120 },
        ]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.addComposerTitle}>{t("garageScreen.addCar.title")}</Text>
        <Text style={styles.addComposerSubtitle}>
          {t("garageScreen.addCar.subtitle")}
        </Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>{t("garageScreen.addCar.previewTitle")}</Text>
          <View style={styles.previewShell}>
            <View style={styles.previewOrbPrimary} />
            <View style={styles.previewOrbSecondary} />
            <View style={styles.previewTopRow}>
              <Text style={styles.previewEyebrow} numberOfLines={1}>
                {nickname.trim() || t("garageScreen.addCar.previewFallback")}
              </Text>
              {purchaseDate ? (
                <View style={styles.previewBadge}>
                  <MaterialIcons name="calendar-today" size={12} color="#D7E5FF" />
                  <Text style={styles.previewBadgeText}>{formattedPurchaseDate}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.previewTitleText}>{previewTitle}</Text>
            <Text style={styles.previewDescription}>
              {t("garageScreen.addCar.previewDescription")}
            </Text>
            <View style={styles.previewMetaRow}>
              {normalizedLicensePlate ? (
                <View style={styles.previewMetaChip}>
                  <Text style={styles.previewMetaChipText}>{normalizedLicensePlate}</Text>
                </View>
              ) : null}
              {fuelType ? (
                <View style={styles.previewMetaChip}>
                  <Text style={styles.previewMetaChipText}>{getFuelLabel(fuelType, t)}</Text>
                </View>
              ) : null}
              {transmission ? (
                <View style={styles.previewMetaChip}>
                  <Text style={styles.previewMetaChipText}>
                    {getTransmissionLabel(transmission, t)}
                  </Text>
                </View>
              ) : null}
              {color.trim() ? (
                <View style={styles.previewMetaChip}>
                  <Text style={styles.previewMetaChipText}>{color.trim()}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>{t("garageScreen.addCar.primarySectionTitle")}</Text>

          <Text style={styles.inputLabel}>{t("carDetail.nicknameLabel")}</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t("carDetail.nicknamePlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
          />

          <CarBrandModelFields
            brand={brand}
            model={model}
            onBrandChange={setBrand}
            onModelChange={setModel}
          />

          <Text style={styles.inputLabel}>{t("carDetail.yearLabel")}</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder={t("carDetail.yearPlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>{t("garageScreen.addCar.secondarySectionTitle")}</Text>

          <Text style={styles.inputLabel}>{t("carDetail.licensePlateLabel")}</Text>
          <TextInput
            style={styles.input}
            value={licensePlate}
            onChangeText={setLicensePlate}
            placeholder={t("carDetail.licensePlatePlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
            autoCapitalize="characters"
          />

          <Text style={styles.inputLabel}>{t("carDetail.colorLabel")}</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder={t("carDetail.colorPlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
          />

          <Text style={styles.inputLabel}>{t("carDetail.purchaseDateLabel")}</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowPurchaseDatePicker((current) => !current)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.dateInputText,
                !purchaseDate && styles.dateInputTextPlaceholder,
              ]}
            >
              {formattedPurchaseDate}
            </Text>
            <MaterialIcons name="calendar-today" size={18} color={tokens.textSecondary} />
          </TouchableOpacity>

          {purchaseDate ? (
            <TouchableOpacity
              style={styles.dateClearButton}
              onPress={() => {
                setPurchaseDate(undefined);
                setShowPurchaseDatePicker(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dateClearButtonText}>
                {t("carDetail.purchaseDateClear")}
              </Text>
            </TouchableOpacity>
          ) : null}

          {showPurchaseDatePicker ? (
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={purchaseDateValue}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handlePurchaseDateChange}
              />
            </View>
          ) : null}

          <Text style={styles.inputLabel}>{t("carDetail.fuelTypeLabel")}</Text>
          <View style={styles.chipRow}>
            {FUEL_OPTIONS.map((fuelValue) => (
              <TouchableOpacity
                key={fuelValue}
                style={[
                  styles.selectChip,
                  fuelType === fuelValue && styles.selectChipActive,
                ]}
                onPress={() =>
                  setFuelType(fuelType === fuelValue ? undefined : fuelValue)
                }
              >
                <Text
                  style={[
                    styles.selectChipText,
                    fuelType === fuelValue && styles.selectChipTextActive,
                  ]}
                >
                  {getFuelLabel(fuelValue, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>{t("carDetail.transmissionLabel")}</Text>
          <View style={styles.chipRow}>
            {TRANSMISSION_OPTIONS.map((transmissionValue) => (
              <TouchableOpacity
                key={transmissionValue}
                style={[
                  styles.selectChip,
                  transmission === transmissionValue && styles.selectChipActive,
                ]}
                onPress={() =>
                  setTransmission(
                    transmission === transmissionValue
                      ? undefined
                      : transmissionValue,
                  )
                }
              >
                <Text
                  style={[
                    styles.selectChipText,
                    transmission === transmissionValue &&
                    styles.selectChipTextActive,
                  ]}
                >
                  {getTransmissionLabel(transmissionValue, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>{t("carDetail.engineCcLabel")}</Text>
          <TextInput
            style={styles.input}
            value={engineCC}
            onChangeText={setEngineCC}
            placeholder={t("carDetail.engineCcPlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
            keyboardType="number-pad"
          />

          <Text style={styles.inputLabel}>{t("carDetail.mileageLabel")}</Text>
          <TextInput
            style={styles.input}
            value={currentMileage}
            onChangeText={setCurrentMileage}
            placeholder={t("carDetail.mileagePlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>{t("garageScreen.addCar.notesSectionTitle")}</Text>
          <Text style={styles.inputLabel}>{t("carDetail.notesLabel")}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t("carDetail.notesPlaceholder")}
            placeholderTextColor={tokens.textPlaceholder}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>{t("garageScreen.addCar.photoSectionTitle")}</Text>
          <CarPhotoGrid
            items={pendingPhotos.map((photo) => ({
              key: photo.uri,
              uri: photo.uri,
            }))}
            maxItems={MAX_CAR_PHOTOS}
            onAddPress={openPhotoPicker}
            onRemovePress={(item) => removePendingPhoto(item.uri)}
            addLabel={t("garageScreen.addCar.addPhotoAction")}
            emptyTitle={t("garageScreen.addCar.photoEmptyTitle")}
            emptyDescription={t("garageScreen.addCar.photoEmptyDescription")}
            isBusy={isPhotoBusy}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.addComposerFooter,
          { paddingBottom: Math.max(bottomInset, 16) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.addComposerButton,
            submitDisabled && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitDisabled}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{t("garageScreen.addCar.cta")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
});

export default function GarageScreen() {
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const { notify } = useNotification();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isAddMode, setIsAddMode] = useState(false);

  const { data, isLoading } = useGetCars(undefined, { enabled: isLoggedIn });
  const analysisLogsQuery = useGetAnalysisLogs(undefined, {
    enabled: isLoggedIn,
  });
  const createCar = useCreateCar();
  const removeCar = useDeleteCar();
  const carUploadUrl = useCarUploadUrl();
  const confirmCarPhoto = useConfirmCarPhoto();
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);

  const cars = useMemo(() => data?.results ?? [], [data?.results]);
  const primaryCar = cars[0] ?? null;
  const scanLogs = useMemo(() => (analysisLogsQuery.data?.results ?? []).slice(0, 4), [analysisLogsQuery.data?.results]);

  const openAddMode = useCallback(() => {
    setIsAddMode(true);
  }, []);

  const closeAddMode = useCallback(() => {
    setIsAddMode(false);
  }, []);

  const handleOpenCar = useCallback(
    (id: string) => {
      router.push(`/car/${id}`);
    },
    [router],
  );

  const handleCreate = useCallback(
    (payload: CreateCarRequest, photos: PendingCarPhoto[]) => {
      createCar.mutate(payload, {
        onSuccess: async (response) => {
          const carId = response.result.id;

          if (photos.length > 0) {
            setIsPhotoBusy(true);
            try {
              for (const photo of photos) {
                const { result: uploadData } =
                  await carUploadUrl.mutateAsync();

                const formData = new FormData();
                formData.append("file", {
                  uri: photo.uri,
                  type: photo.mimeType || "image/jpeg",
                  name: photo.fileName || "photo.jpg",
                } as unknown as Blob);

                await axios.post(uploadData.url, formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });

                await confirmCarPhoto.mutateAsync({
                  id: uploadData.id,
                  carId,
                });
              }
            } catch {
              // silently ignore photo upload errors
            } finally {
              setIsPhotoBusy(false);
            }
          }

          setIsAddMode(false);
          notify({ type: "success", title: t("garageScreen.addCar.success") });
        },
        onError: (error) => {
          notify({
            type: "error",
            title: t("garageScreen.addCar.error"),
            message: error instanceof Error ? error.message : undefined,
          });
        },
      });
    },
    [carUploadUrl, confirmCarPhoto, createCar, notify, t],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(t("garageScreen.deleteTitle"), t("garageScreen.deleteMessage"), [
        { text: t("carDetail.cancel"), style: "cancel" },
        {
          text: t("garageScreen.deleteAction"),
          style: "destructive",
          onPress: () => {
            removeCar.mutate(id, {
              onSuccess: () => {
                notify({ type: "success", title: t("garageScreen.deleteSuccess") });
              },
              onError: (error) => {
                notify({
                  type: "error",
                  title: t("garageScreen.deleteError"),
                  message: error instanceof Error ? error.message : undefined,
                });
              },
            });
          },
        },
      ]);
    },
    [notify, removeCar, t],
  );

  const handleOpenLog = useCallback((_item: AnalyzeMediaLog) => {
    // Navigate to insights tab
    router.push("/insights" as Href);
  }, [router]);

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle={t("garageScreen.title")}
        title={t("garageScreen.loginTitle")}
        description={t("garageScreen.loginDescription")}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <HomeHeader />

      {isAddMode ? (
        <AddCarComposer
          onClose={closeAddMode}
          onSubmit={handleCreate}
          isLoading={createCar.isPending}
          isPhotoBusy={isPhotoBusy}
          bottomInset={insets.bottom}
        />
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading && data === undefined ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : primaryCar ? (
              <>
                <CarHeroCard
                  item={primaryCar}
                  onPress={handleOpenCar}
                  onDelete={handleDelete}
                />

                {cars.length > 1 ? (
                  <View style={styles.otherCarsSection}>
                    {cars.slice(1).map((car) => (
                      <TouchableOpacity
                        key={car.id}
                        style={styles.otherCarChip}
                        onPress={() => handleOpenCar(car.id)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="directions-car" size={16} color={Colors.primary} />
                        <Text style={styles.otherCarText}>
                          {car.brand} {car.model} ({car.year})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <View style={styles.scansSectionHeader}>
                  <Text style={styles.scansSectionTitle}>{t("garageScreen.recentScansTitle")}</Text>
                  <TouchableOpacity onPress={() => router.push("/insights" as Href)}>
                    <Text style={styles.scansSeeAll}>{t("garageScreen.seeAll")}</Text>
                  </TouchableOpacity>
                </View>

                {scanLogs.length > 0 ? (
                  <View style={styles.scansList}>
                    {scanLogs.map((log) => (
                      <ScanHistoryItem key={log.id} item={log} onPress={handleOpenLog} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.noScansBox}>
                    <Text style={styles.noScansText}>{t("garageScreen.noScans")}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="directions-car"
                  size={64}
                  color={tokens.textTertiary}
                />
                <Text style={styles.emptyTitle}>{t("garageScreen.emptyTitle")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("garageScreen.emptySubtitle")}
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={openAddMode}
                  activeOpacity={0.85}
                >
                  <MaterialIcons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyActionText}>{t("garageScreen.emptyAction")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {primaryCar ? (
            <TouchableOpacity
              style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]}
              onPress={openAddMode}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  addComposerContainer: {
    flex: 1,
  },
  addComposerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  addComposerHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.surfaceContainerLow,
  },
  addComposerHeaderTextButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  addComposerHeaderText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textSecondary,
  },
  addComposerScroll: {
    flex: 1,
  },
  addComposerContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 16,
  },
  addComposerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: tokens.textPrimary,
  },
  addComposerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
    color: tokens.textSecondary,
    marginTop: -6,
  },
  previewCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 28,
    padding: 18,
    ...ambientShadow,
  },
  previewLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: tokens.textSecondary,
    marginBottom: 12,
  },
  previewShell: {
    overflow: "hidden",
    borderRadius: 24,
    padding: 20,
    minHeight: 190,
    backgroundColor: "#0F2F63",
    justifyContent: "space-between",
  },
  previewOrbPrimary: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(101, 170, 255, 0.18)",
    top: -40,
    right: -30,
  },
  previewOrbSecondary: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    bottom: -10,
    left: -10,
  },
  previewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  previewEyebrow: {
    flex: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    letterSpacing: 0.5,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  previewBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: "#F2F7FF",
  },
  previewTitleText: {
    fontFamily: FontFamily.bold,
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: "#FFFFFF",
    marginTop: 18,
  },
  previewDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    marginTop: 6,
    maxWidth: "78%",
  },
  previewMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  previewMetaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  previewMetaChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: "#FFFFFF",
  },
  formCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    ...ambientShadow,
  },
  formCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
    color: tokens.textPrimary,
    marginBottom: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  // ── Hero Car Card ──
  heroCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: tokens.surfaceContainerLowest,
    marginBottom: 16,
    ...ambientShadow,
  },
  heroCardInner: {
    height: 200,
    justifyContent: "flex-end",
  },
  heroOverlay: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroTextBlock: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: "#FFFFFF",
  },
  heroSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.8)",
  },
  heroDeleteBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tokens.surfaceContainerLowest,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: tokens.borderSubtle,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: tokens.textTertiary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: tokens.textPrimary,
    marginTop: 2,
  },
  // ── Other cars ──
  otherCarsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  otherCarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: tokens.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    ...ambientShadow,
  },
  otherCarText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: tokens.textPrimary,
  },
  // ── Past Scans Section ──
  scansSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scansSectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: tokens.textPrimary,
  },
  scansSeeAll: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.secondary,
    letterSpacing: 0.7,
  },
  scansList: {
    gap: 12,
  },
  scanItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    ...ambientShadow,
  },
  scanItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scanItemContent: {
    flex: 1,
    gap: 2,
  },
  scanItemTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  scanItemDate: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: tokens.textTertiary,
  },
  scanItemBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  noScansBox: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    ...ambientShadow,
  },
  noScansText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: tokens.textTertiary,
  },
  // ── FAB ──
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.primary,
    alignItems: "center",
    justifyContent: "center",
    ...ambientShadow,
    shadowOpacity: 0.15,
    elevation: 6,
  },
  // ── Empty ──
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: tokens.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: tokens.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 9999,
    marginTop: 16,
  },
  emptyActionText: {
    fontFamily: FontFamily.semiBold,
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 0.7,
  },
  inputLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textPrimary,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    fontFamily: FontFamily.regular,
    backgroundColor: tokens.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: tokens.textPrimary,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: tokens.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  dateInputText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  dateInputTextPlaceholder: {
    color: tokens.textPlaceholder,
  },
  dateClearButton: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  dateClearButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: tokens.secondary,
  },
  datePickerWrapper: {
    alignItems: "center",
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: tokens.surfaceContainerLow,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: tokens.surfaceContainerLow,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  selectChipActive: {
    backgroundColor: tokens.primary,
    borderColor: tokens.primary,
  },
  selectChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: tokens.textSecondary,
  },
  selectChipTextActive: {
    color: "#FFFFFF",
  },
  notesInput: {
    minHeight: 120,
    paddingTop: 14,
  },
  photoPlaceholderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: tokens.borderSubtle,
    backgroundColor: tokens.surfaceContainerLow,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: "center",
  },
  photoPlaceholderIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.primaryLight,
    marginBottom: 12,
  },
  photoPlaceholderTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  photoPlaceholderDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    color: tokens.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  addComposerFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: tokens.bgBase,
  },
  addComposerButton: {
    backgroundColor: tokens.primary,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    ...ambientShadow,
  },
  submitButton: {
    backgroundColor: tokens.primary,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: FontFamily.semiBold,
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 0.7,
  },
});
