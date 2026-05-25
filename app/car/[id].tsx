import { LegendList } from "@legendapp/list";
import { Colors, tokens, FontFamily, ambientShadow } from "@/constants/theme";
import LoginRequired from "@/components/LoginRequired";
import ScreenContainer from "@/components/ScreenContainer";
import { useNotification } from "@/components/Notification";
import { useGetCar, useUpdateCar } from "@/query-hooks/useCars";
import { useGetAnalysisLogs } from "@/query-hooks/useAnalysisLogs";
import { useAuthStore } from "@/store/useAuth";
import { AnalyzeMediaLog, AiAnalysisType, AiUrgency } from "@/types/ai";
import { AuthStatusEnum } from "@/types/auth";
import {
  Car,
  FuelTypeEnum,
  TransmissionEnum,
  UpdateCarRequest,
} from "@/types/car";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

const ANALYSIS_TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  [AiAnalysisType.DASHBOARD]: "dashboard",
  [AiAnalysisType.WARNING_LIGHT]: "warning",
  [AiAnalysisType.OBD_CODE]: "bluetooth-searching",
  [AiAnalysisType.GENERAL]: "search",
};

function urgencyColors(urgency: AiUrgency) {
  switch (urgency) {
    case "critical":
      return { bg: tokens.dangerBg, text: tokens.danger };
    case "warning":
      return { bg: tokens.warningBg, text: tokens.warning };
    case "info":
      return { bg: tokens.infoBg, text: Colors.primary };
  }
}

function statusColor(status: string) {
  if (status === "completed") return tokens.success;
  if (status === "failed") return tokens.danger;
  return tokens.warning;
}

function getFuelLabel(fuelType: FuelTypeEnum, t: (key: string) => string) {
  return t(FUEL_LABEL_KEYS[fuelType]);
}

function getTransmissionLabel(
  transmission: TransmissionEnum,
  t: (key: string) => string,
) {
  return t(TRANSMISSION_LABEL_KEYS[transmission]);
}

function statusLabel(status: string, t: (key: string) => string) {
  if (status === "completed") return t("history.status.completed");
  if (status === "failed") return t("history.status.failed");
  if (status === "pending") return t("history.status.pending");
  return status;
}

const AnalysisCard = React.memo(function AnalysisCard({ item }: { item: AnalyzeMediaLog }) {
  const { t } = useTranslation();
  const urgency = item.aiResponse?.urgency;
  const colors = urgency ? urgencyColors(urgency) : null;
  const icon = ANALYSIS_TYPE_ICONS[item.analysisType] ?? "search";

  return (
    <View style={styles.analysisCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconBadge}>
            <MaterialIcons name={icon} size={16} color={Colors.primary} />
          </View>
          <Text style={styles.analysisTitle} numberOfLines={1}>
            {item.aiResponse?.title ?? item.analysisType}
          </Text>
        </View>
        {urgency && colors ? (
          <View style={[styles.urgencyBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.urgencyText, { color: colors.text }]}>
              {t(`history.urgency.${urgency}`)}
            </Text>
          </View>
        ) : null}
      </View>
      {item.aiResponse?.summary ? (
        <Text style={styles.analysisSummary} numberOfLines={2}>
          {item.aiResponse.summary}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
        <View style={styles.metaRight}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor(item.status) },
            ]}
          />
          <Text style={[styles.metaText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status, t)}
          </Text>
        </View>
      </View>
    </View>
  );
});

const EditCarModal = React.memo(function EditCarModal({
  car,
  visible,
  onClose,
  onSubmit,
  isLoading,
}: {
  car: Car;
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateCarRequest) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [brand, setBrand] = useState(car.brand);
  const [model, setModel] = useState(car.model);
  const [year, setYear] = useState(String(car.year));
  const [fuelType, setFuelType] = useState<FuelTypeEnum | undefined>(car.fuelType);
  const [transmission, setTransmission] = useState<TransmissionEnum | undefined>(
    car.transmission,
  );
  const [engineCC, setEngineCC] = useState(
    car.engineCC != null ? String(car.engineCC) : "",
  );
  const [currentMileage, setCurrentMileage] = useState(
    car.currentMileage != null ? String(car.currentMileage) : "",
  );
  const [nickname, setNickname] = useState(car.nickname ?? "");
  const [licensePlate, setLicensePlate] = useState(car.licensePlate ?? "");
  const [color, setColor] = useState(car.color ?? "");
  const [notes, setNotes] = useState(car.notes ?? "");
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>(
    car.purchaseDate,
  );
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);

  const parsedYear = parseInt(year, 10);
  const submitDisabled =
    isLoading || !brand.trim() || !model.trim() || Number.isNaN(parsedYear);

  const purchaseDateValue = useMemo(() => {
    if (!purchaseDate) {
      return new Date();
    }

    return new Date(purchaseDate);
  }, [purchaseDate]);

  const formattedPurchaseDate = purchaseDate
    ? dayjs(purchaseDate).format("DD.MM.YYYY")
    : t("carDetail.purchaseDatePlaceholder");

  const normalizedLicensePlate = useMemo(
    () => licensePlate.trim().replace(/\s+/g, " ").toUpperCase(),
    [licensePlate],
  );

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

  const handleSubmit = useCallback(() => {
    if (!brand.trim() || !model.trim() || Number.isNaN(parsedYear)) {
      return;
    }

    onSubmit({
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
    });
  }, [
    brand,
    color,
    currentMileage,
    engineCC,
    fuelType,
    nickname,
    normalizedLicensePlate,
    notes,
    model,
    onSubmit,
    parsedYear,
    purchaseDate,
    transmission,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t("carDetail.editTitle")}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>
        <LegendList
          data={[0]}
          renderItem={() => (
            <>
              <Text style={styles.inputLabel}>{t("carDetail.nicknameLabel")}</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder={t("carDetail.nicknamePlaceholder")}
                placeholderTextColor={tokens.textPlaceholder}
              />

              <Text style={styles.inputLabel}>{t("carDetail.brandLabel")}</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder={t("carDetail.brandPlaceholder")}
                placeholderTextColor={tokens.textPlaceholder}
              />

              <Text style={styles.inputLabel}>{t("carDetail.modelLabel")}</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder={t("carDetail.modelPlaceholder")}
                placeholderTextColor={tokens.textPlaceholder}
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
                        transmission === transmissionValue ? undefined : transmissionValue,
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
            </>
          )}
          keyExtractor={() => "edit-car-form"}
          estimatedItemSize={900}
          initialContainerPoolRatio={4}
          style={styles.modalBody}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitDisabled && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitDisabled}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{t("carDetail.save")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

export default function CarDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const router = useRouter();
  const { notify } = useNotification();
  const [editVisible, setEditVisible] = useState(false);

  const { data: carData, isLoading: carLoading, refetch: refetchCar } = useGetCar(
    id ?? "",
    { enabled: isLoggedIn && !!id },
  );
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useGetAnalysisLogs(
    { carId: id ?? "" },
    { enabled: isLoggedIn && !!id },
  );
  const updateCar = useUpdateCar();

  const isLoading = carLoading || logsLoading;
  const car = carData?.result;
  const logs = useMemo(() => logsData?.results ?? [], [logsData?.results]);

  const openEdit = useCallback(() => {
    setEditVisible(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditVisible(false);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchCar();
    refetchLogs();
  }, [refetchCar, refetchLogs]);

  const handleUpdate = useCallback(
    (data: UpdateCarRequest) => {
      if (!id) return;
      updateCar.mutate(
        { id, payload: data },
        {
          onSuccess: () => {
            setEditVisible(false);
            notify({ type: "success", title: t("carDetail.updated") });
            refetchCar();
          },
          onError: (error) => {
            notify({
              type: "error",
              title: t("carDetail.updateFailed"),
              message: error instanceof Error ? error.message : undefined,
            });
          },
        },
      );
    },
    [id, notify, refetchCar, t, updateCar],
  );

  const renderItem = useCallback(
    ({ item }: { item: AnalyzeMediaLog }) => <AnalysisCard item={item} />,
    [],
  );
  const keyExtractor = useCallback((item: AnalyzeMediaLog) => item.id, []);

  const listHeader = useMemo(() => {
    if (!car) return null;

    const displayTitle = car.nickname?.trim() || `${car.brand} ${car.model}`;

    return (
      <>
        <View style={styles.carCard}>
          <View style={styles.carCardHeader}>
            <MaterialIcons
              name="directions-car"
              size={24}
              color={Colors.primary}
            />
            <View style={styles.carCardHeaderText}>
              <Text style={styles.carCardTitle}>{displayTitle}</Text>
              {car.nickname?.trim() ? (
                <Text style={styles.carCardSubtitle}>
                  {car.brand} {car.model}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailChip}>
              <MaterialIcons
                name="calendar-today"
                size={14}
                color={tokens.textSecondary}
              />
              <Text style={styles.detailText}>{car.year}</Text>
            </View>
            {car.fuelType ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="local-gas-station"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>
                  {getFuelLabel(car.fuelType, t)}
                </Text>
              </View>
            ) : null}
            {car.transmission ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="settings"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>
                  {getTransmissionLabel(car.transmission, t)}
                </Text>
              </View>
            ) : null}
            {car.engineCC != null ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="speed"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>{car.engineCC} cc</Text>
              </View>
            ) : null}
            {car.currentMileage != null ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="timeline"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>
                  {car.currentMileage.toLocaleString()} km
                </Text>
              </View>
            ) : null}
            {car.licensePlate ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="badge"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>{car.licensePlate}</Text>
              </View>
            ) : null}
            {car.color ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="palette"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>{car.color}</Text>
              </View>
            ) : null}
            {car.purchaseDate ? (
              <View style={styles.detailChip}>
                <MaterialIcons
                  name="event"
                  size={14}
                  color={tokens.textSecondary}
                />
                <Text style={styles.detailText}>
                  {dayjs(car.purchaseDate).format("DD.MM.YYYY")}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.dateText}>
            {t("carDetail.addedOn", {
              date: dayjs(car.createdAt).format("DD.MM.YYYY"),
            })}
          </Text>
          {car.notes?.trim() ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesCardLabel}>{t("carDetail.notesLabel")}</Text>
              <Text style={styles.notesCardText}>{car.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("carDetail.analyses")}</Text>
          <Text style={styles.sectionCount}>{logs.length}</Text>
        </View>
      </>
    );
  }, [car, logs.length, t]);

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyAnalysis}>
        <MaterialIcons name="history" size={40} color={tokens.textTertiary} />
        <Text style={styles.emptyText}>{t("carDetail.emptyAnalysis")}</Text>
      </View>
    ),
    [t],
  );

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle={t("carDetail.title")}
        title={t("tabs.signIn")}
        description={t("history.loginRequiredDescription")}
      />
    );
  }

  if (carLoading && !carData) {
    return (
      <ScreenContainer
        title={t("carDetail.title")}
        showBackButton
        scrollable={false}
        contentContainerStyle={styles.screenContent}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!car) {
    return (
      <ScreenContainer
        title={t("carDetail.title")}
        showBackButton
        scrollable={false}
        contentContainerStyle={styles.screenContent}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{t("carDetail.notFound")}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{t("carDetail.back")}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title={car.nickname?.trim() || `${car.brand} ${car.model}`}
      showBackButton
      scrollable={false}
      contentContainerStyle={styles.screenContent}
      headerRight={
        <TouchableOpacity
          onPress={openEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="edit" size={22} color={Colors.primary} />
        </TouchableOpacity>
      }
    >
      {logsLoading && !logsData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <LegendList
          data={logs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={104}
          initialContainerPoolRatio={4}
          recycleItems
          refreshing={isLoading}
          onRefresh={handleRefresh}
          style={styles.listView}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {editVisible ? (
        <EditCarModal
          car={car}
          visible={editVisible}
          onClose={closeEdit}
          onSubmit={handleUpdate}
          isLoading={updateCar.isPending}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  listView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  listSeparator: {
    height: 12,
  },
  errorText: {
    fontSize: 16,
    color: tokens.textSecondary,
    marginBottom: 12,
  },
  backLink: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  carCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 24,
    ...ambientShadow,
  },
  carCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  carCardHeaderText: {
    flex: 1,
    gap: 2,
  },
  carCardTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: tokens.textPrimary,
  },
  carCardSubtitle: {
    fontSize: 13,
    color: tokens.textSecondary,
    fontFamily: FontFamily.medium,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: tokens.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 12,
    color: tokens.textSecondary,
    fontFamily: FontFamily.medium,
  },
  dateText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  notesCard: {
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: tokens.bgSubtle,
    padding: 12,
    gap: 6,
  },
  notesCardLabel: {
    fontSize: 12,
    color: tokens.textTertiary,
    fontFamily: FontFamily.semiBold,
  },
  notesCardText: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textPrimary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: tokens.textPrimary,
  },
  sectionCount: {
    fontSize: 13,
    color: tokens.textTertiary,
    fontFamily: FontFamily.semiBold,
  },
  analysisCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    ...ambientShadow,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: tokens.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  analysisTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: tokens.textPrimary,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  analysisSummary: {
    fontSize: 13,
    color: tokens.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyAnalysis: {
    alignItems: "center",
    paddingTop: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: tokens.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.bgSurface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderDefault,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: tokens.textPrimary,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: tokens.borderDefault,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: tokens.textPrimary,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: tokens.bgSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: tokens.textPrimary,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: tokens.bgSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  dateInputText: {
    fontSize: 15,
    color: tokens.textPrimary,
    fontFamily: FontFamily.regular,
  },
  dateInputTextPlaceholder: {
    color: tokens.textPlaceholder,
  },
  dateClearButton: {
    alignSelf: "flex-start",
    marginTop: 10,
  },
  dateClearButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
  },
  datePickerWrapper: {
    alignItems: "center",
    marginTop: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: tokens.bgSubtle,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: tokens.bgSubtle,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  selectChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectChipText: {
    fontSize: 13,
    color: tokens.textSecondary,
    fontFamily: FontFamily.medium,
  },
  selectChipTextActive: {
    color: "#FFFFFF",
  },
  notesInput: {
    minHeight: 120,
    paddingTop: 14,
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
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
