import { Colors, tokens } from "@/constants/theme";
import ScreenContainer from "@/components/ScreenContainer";
import { useGetCar, useUpdateCar } from "@/query-hooks/useCars";
import { useGetAnalysisLogs } from "@/query-hooks/useAnalysisLogs";
import { AnalyzeMediaLog, AiAnalysisType, AiUrgency } from "@/types/ai";
import { Car, FuelTypeEnum, TransmissionEnum, UpdateCarRequest } from "@/types/car";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNotification } from "@/components/Notification";

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

function statusLabel(status: string) {
  if (status === "completed") return "Tamamlandı";
  if (status === "failed") return "Başarısız";
  if (status === "pending") return "Bekliyor";
  return status;
}

function AnalysisCard({ item }: { item: AnalyzeMediaLog }) {
  const urgency = item.aiResponse?.urgency;
  const uColors = urgency ? urgencyColors(urgency) : null;
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
        {urgency && uColors && (
          <View style={[styles.urgencyBadge, { backgroundColor: uColors.bg }]}>
            <Text style={[styles.urgencyText, { color: uColors.text }]}>
              {urgency === "critical" ? "Kritik" : urgency === "warning" ? "Uyarı" : "Bilgi"}
            </Text>
          </View>
        )}
      </View>
      {item.aiResponse?.summary && (
        <Text style={styles.analysisSummary} numberOfLines={2}>
          {item.aiResponse.summary}
        </Text>
      )}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={[styles.metaText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EditCarModal({
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
  const [brand, setBrand] = useState(car.brand);
  const [model, setModel] = useState(car.model);
  const [year, setYear] = useState(String(car.year));
  const [fuelType, setFuelType] = useState<FuelTypeEnum | undefined>(car.fuelType);
  const [transmission, setTransmission] = useState<TransmissionEnum | undefined>(car.transmission);
  const [engineCC, setEngineCC] = useState(car.engineCC != null ? String(car.engineCC) : "");

  const handleSubmit = () => {
    const y = parseInt(year, 10);
    if (!brand.trim() || !model.trim() || isNaN(y)) return;
    onSubmit({
      brand: brand.trim(),
      model: model.trim(),
      year: y,
      fuelType,
      transmission,
      engineCC: engineCC ? parseInt(engineCC, 10) : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Aracı Düzenle</Text>
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
            {Object.values(FuelTypeEnum).map((ft) => (
              <TouchableOpacity
                key={ft}
                style={[styles.selectChip, fuelType === ft && styles.selectChipActive]}
                onPress={() => setFuelType(fuelType === ft ? undefined : ft)}
              >
                <Text style={[styles.selectChipText, fuelType === ft && styles.selectChipTextActive]}>
                  {FUEL_LABELS[ft]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Vites</Text>
          <View style={styles.chipRow}>
            {Object.values(TransmissionEnum).map((tr) => (
              <TouchableOpacity
                key={tr}
                style={[styles.selectChip, transmission === tr && styles.selectChipActive]}
                onPress={() => setTransmission(transmission === tr ? undefined : tr)}
              >
                <Text style={[styles.selectChipText, transmission === tr && styles.selectChipTextActive]}>
                  {TRANSMISSION_LABELS[tr]}
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
        </ScrollView>
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!brand.trim() || !model.trim() || !year.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading || !brand.trim() || !model.trim() || !year.trim()}
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
}

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useNotification();
  const [editVisible, setEditVisible] = useState(false);

  const { data: carData, isLoading: carLoading, refetch: refetchCar } = useGetCar(id ?? "");
  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useGetAnalysisLogs({ carId: id ?? "" });
  const updateCar = useUpdateCar();

  const isLoading = carLoading || logsLoading;
  const car = carData?.result;
  const logs: AnalyzeMediaLog[] = logsData?.results ?? [];

  const handleRefresh = () => {
    refetchCar();
    refetchLogs();
  };

  const handleUpdate = (data: UpdateCarRequest) => {
    if (!id) return;
    updateCar.mutate(
      { id, payload: data },
      {
        onSuccess: () => {
          setEditVisible(false);
          notify({ type: "success", title: "Araç güncellendi" });
          refetchCar();
        },
        onError: (err) => {
          notify({
            type: "error",
            title: "Güncelleme başarısız",
            message: err instanceof Error ? err.message : undefined,
          });
        },
      },
    );
  };

  return (
    <ScreenContainer
      title={car ? `${car.brand} ${car.model}` : "Araç Detayı"}
      showBackButton
      refreshControl={
        <RefreshControl refreshing={isLoading && !!carData} onRefresh={handleRefresh} />
      }
      headerRight={
        car ? (
          <TouchableOpacity
            onPress={() => setEditVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="edit" size={22} color={Colors.primary} />
          </TouchableOpacity>
        ) : undefined
      }
    >
      {carLoading && !carData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : car ? (
        <>
          {/* Car Info Card */}
          <View style={styles.carCard}>
            <View style={styles.carCardHeader}>
              <MaterialIcons name="directions-car" size={24} color={Colors.primary} />
              <Text style={styles.carCardTitle}>
                {car.brand} {car.model}
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <View style={styles.detailChip}>
                <MaterialIcons name="calendar-today" size={14} color={tokens.textSecondary} />
                <Text style={styles.detailText}>{car.year}</Text>
              </View>
              {car.fuelType && (
                <View style={styles.detailChip}>
                  <MaterialIcons name="local-gas-station" size={14} color={tokens.textSecondary} />
                  <Text style={styles.detailText}>
                    {FUEL_LABELS[car.fuelType] ?? car.fuelType}
                  </Text>
                </View>
              )}
              {car.transmission && (
                <View style={styles.detailChip}>
                  <MaterialIcons name="settings" size={14} color={tokens.textSecondary} />
                  <Text style={styles.detailText}>
                    {TRANSMISSION_LABELS[car.transmission] ?? car.transmission}
                  </Text>
                </View>
              )}
              {car.engineCC != null && (
                <View style={styles.detailChip}>
                  <MaterialIcons name="speed" size={14} color={tokens.textSecondary} />
                  <Text style={styles.detailText}>{car.engineCC} cc</Text>
                </View>
              )}
            </View>
            <Text style={styles.dateText}>
              Eklendi: {dayjs(car.createdAt).format("DD.MM.YYYY")}
            </Text>
          </View>

          {/* Analysis Logs */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analizler</Text>
            <Text style={styles.sectionCount}>{logs.length}</Text>
          </View>

          {logsLoading && !logsData ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : logs.length > 0 ? (
            <View style={styles.list}>
              {logs.map((log) => (
                <AnalysisCard key={log.id} item={log} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyAnalysis}>
              <MaterialIcons name="history" size={40} color={tokens.textTertiary} />
              <Text style={styles.emptyText}>Bu araç için analiz yok</Text>
            </View>
          )}

          {editVisible && (
            <EditCarModal
              car={car}
              visible={editVisible}
              onClose={() => setEditVisible(false)}
              onSubmit={handleUpdate}
              isLoading={updateCar.isPending}
            />
          )}
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Araç bulunamadı</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Geri dön</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  errorText: {
    fontSize: 16,
    color: tokens.textSecondary,
    marginBottom: 12,
  },
  backLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: "600",
  },
  carCard: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    marginBottom: 24,
  },
  carCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  carCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: tokens.textPrimary,
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
    fontWeight: "500",
  },
  dateText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  sectionCount: {
    fontSize: 13,
    color: tokens.textTertiary,
    fontWeight: "600",
  },
  list: {
    gap: 12,
  },
  analysisCard: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
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
    fontWeight: "700",
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
    fontWeight: "700",
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
  // Modal
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
    fontWeight: "700",
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
    fontWeight: "600",
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
    fontWeight: "500",
  },
  selectChipTextActive: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
