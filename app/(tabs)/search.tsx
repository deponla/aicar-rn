import { Colors, tokens, FontFamily, ambientShadow } from "@/constants/theme";
import HomeHeader from "@/components/HomeHeader";
import LoginRequired from "@/components/LoginRequired";
import { useNotification } from "@/components/Notification";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { Car, CreateCarRequest, FuelTypeEnum, TransmissionEnum } from "@/types/car";
import { AnalyzeMediaLog, AiUrgency } from "@/types/ai";
import {
  useGetCars,
  useCreateCar,
  useDeleteCar,
} from "@/query-hooks/useCars";
import { useGetAnalysisLogs } from "@/query-hooks/useAnalysisLogs";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Href, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FUEL_LABELS: Record<FuelTypeEnum, string> = {
  [FuelTypeEnum.GASOLINE]: "Benzin",
  [FuelTypeEnum.DIESEL]: "Dizel",
  [FuelTypeEnum.LPG]: "LPG",
  [FuelTypeEnum.ELECTRIC]: "Elektrik",
  [FuelTypeEnum.HYBRID]: "Hibrit",
};

const TRANSMISSION_LABELS: Record<TransmissionEnum, string> = {
  [TransmissionEnum.MANUAL]: "Manuel",
  [TransmissionEnum.AUTOMATIC]: "Otomatik",
};

const FUEL_OPTIONS = Object.values(FuelTypeEnum);
const TRANSMISSION_OPTIONS = Object.values(TransmissionEnum);

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
              {item.fuelType ? FUEL_LABELS[item.fuelType] : ""}{item.transmission ? ` • ${TRANSMISSION_LABELS[item.transmission]}` : ""}
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
            <Text style={styles.statLabel}>ODOMETER</Text>
            <Text style={styles.statValue}>{item.currentMileage.toLocaleString()} km</Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

const AddCarModal = React.memo(function AddCarModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCarRequest) => void;
  isLoading: boolean;
}) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState<FuelTypeEnum | undefined>();
  const [transmission, setTransmission] = useState<
    TransmissionEnum | undefined
  >();
  const [engineCC, setEngineCC] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");

  const handleSubmit = useCallback(() => {
    const parsedYear = parseInt(year, 10);
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
    });
  }, [
    brand,
    currentMileage,
    engineCC,
    fuelType,
    model,
    onSubmit,
    transmission,
    year,
  ]);

  const reset = useCallback(() => {
    setBrand("");
    setModel("");
    setYear("");
    setFuelType(undefined);
    setTransmission(undefined);
    setEngineCC("");
    setCurrentMileage("");
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={reset}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Araç Ekle</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.inputLabel}>Marka *</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="ör. Toyota"
            placeholderTextColor={tokens.textPlaceholder}
          />

          <Text style={styles.inputLabel}>Model *</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="ör. Corolla"
            placeholderTextColor={tokens.textPlaceholder}
          />

          <Text style={styles.inputLabel}>Yıl *</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            placeholder="ör. 2020"
            placeholderTextColor={tokens.textPlaceholder}
            keyboardType="number-pad"
          />

          <Text style={styles.inputLabel}>Yakıt Tipi</Text>
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
                  {FUEL_LABELS[fuelValue]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Vites</Text>
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
                  {TRANSMISSION_LABELS[transmissionValue]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Motor Hacmi (cc)</Text>
          <TextInput
            style={styles.input}
            value={engineCC}
            onChangeText={setEngineCC}
            placeholder="ör. 1600"
            placeholderTextColor={tokens.textPlaceholder}
            keyboardType="number-pad"
          />

          <Text style={styles.inputLabel}>Kilometre (km)</Text>
          <TextInput
            style={styles.input}
            value={currentMileage}
            onChangeText={setCurrentMileage}
            placeholder="ör. 128500"
            placeholderTextColor={tokens.textPlaceholder}
            keyboardType="number-pad"
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!brand.trim() || !model.trim() || !year.trim()) &&
              styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              isLoading || !brand.trim() || !model.trim() || !year.trim()
            }
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

export default function GarageScreen() {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const { notify } = useNotification();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading } = useGetCars(undefined, { enabled: isLoggedIn });
  const analysisLogsQuery = useGetAnalysisLogs(undefined, {
    enabled: isLoggedIn,
  });
  const createCar = useCreateCar();
  const removeCar = useDeleteCar();

  const cars = useMemo(() => data?.results ?? [], [data?.results]);
  const primaryCar = cars[0] ?? null;
  const scanLogs = useMemo(() => (analysisLogsQuery.data?.results ?? []).slice(0, 4), [analysisLogsQuery.data?.results]);

  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleOpenCar = useCallback(
    (id: string) => {
      router.push(`/car/${id}`);
    },
    [router],
  );

  const handleCreate = useCallback(
    (payload: Parameters<typeof createCar.mutate>[0]) => {
      createCar.mutate(payload, {
        onSuccess: () => {
          setModalVisible(false);
          notify({ type: "success", title: "Araç başarıyla eklendi" });
        },
        onError: (error) => {
          notify({
            type: "error",
            title: "Araç eklenemedi",
            message: error instanceof Error ? error.message : undefined,
          });
        },
      });
    },
    [createCar, notify],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Aracı Sil", "Bu aracı silmek istediğinize emin misiniz?", [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            removeCar.mutate(id, {
              onSuccess: () => {
                notify({ type: "success", title: "Araç silindi" });
              },
              onError: (error) => {
                notify({
                  type: "error",
                  title: "Araç silinemedi",
                  message: error instanceof Error ? error.message : undefined,
                });
              },
            });
          },
        },
      ]);
    },
    [notify, removeCar],
  );

  const handleOpenLog = useCallback((_item: AnalyzeMediaLog) => {
    // Navigate to insights tab
    router.push("/insights" as Href);
  }, [router]);

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle="Garajım"
        title="Araçlarınızı yönetin"
        description="Araçlarınızı eklemek ve analiz sonuçlarını takip etmek için giriş yapın."
      />
    );
  }

  return (
    <View style={styles.screen}>
      <HomeHeader />

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

            {/* Other cars */}
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

            {/* Past Scans Section */}
            <View style={styles.scansSectionHeader}>
              <Text style={styles.scansSectionTitle}>Gecmis Taramalar</Text>
              <TouchableOpacity onPress={() => router.push("/insights" as Href)}>
                <Text style={styles.scansSeeAll}>Tumunu Gor</Text>
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
                <Text style={styles.noScansText}>Henuz tarama yapilmadi</Text>
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
            <Text style={styles.emptyTitle}>Henüz araç eklemediniz</Text>
            <Text style={styles.emptySubtitle}>
              Garajınıza araç ekleyerek analiz sonuçlarını takip edebilirsiniz.
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={openModal}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionText}>Araç Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* FAB for adding cars */}
      {primaryCar ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: 20 }]}
          onPress={openModal}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      <AddCarModal
        visible={modalVisible}
        onClose={closeModal}
        onSubmit={handleCreate}
        isLoading={createCar.isPending}
      />
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
  listSeparator: {
    height: 12,
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
    borderBottomColor: tokens.borderSubtle,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
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
    borderTopColor: tokens.borderSubtle,
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
