import { Colors, tokens } from "@/constants/theme";
import LoginRequired from "@/components/LoginRequired";
import ScreenContainer from "@/components/ScreenContainer";
import { useNotification } from "@/components/Notification";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { Car, FuelTypeEnum, TransmissionEnum } from "@/types/car";
import {
  useGetCars,
  useCreateCar,
  useDeleteCar,
} from "@/query-hooks/useCars";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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

function CarCard({
  item,
  onDelete,
}: {
  item: Car;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialIcons
            name="directions-car"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.cardTitle}>
            {item.brand} {item.model}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="delete-outline" size={20} color={tokens.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailChip}>
          <MaterialIcons
            name="calendar-today"
            size={14}
            color={tokens.textSecondary}
          />
          <Text style={styles.detailText}>{item.year}</Text>
        </View>
        {item.fuelType && (
          <View style={styles.detailChip}>
            <MaterialIcons
              name="local-gas-station"
              size={14}
              color={tokens.textSecondary}
            />
            <Text style={styles.detailText}>
              {FUEL_LABELS[item.fuelType] ?? item.fuelType}
            </Text>
          </View>
        )}
        {item.transmission && (
          <View style={styles.detailChip}>
            <MaterialIcons
              name="settings"
              size={14}
              color={tokens.textSecondary}
            />
            <Text style={styles.detailText}>
              {TRANSMISSION_LABELS[item.transmission] ?? item.transmission}
            </Text>
          </View>
        )}
        {item.engineCC != null && (
          <View style={styles.detailChip}>
            <MaterialIcons
              name="speed"
              size={14}
              color={tokens.textSecondary}
            />
            <Text style={styles.detailText}>{item.engineCC} cc</Text>
          </View>
        )}
      </View>

      <Text style={styles.dateText}>
        Eklendi: {dayjs(item.createdAt).format("DD.MM.YYYY")}
      </Text>
    </View>
  );
}

function AddCarModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    brand: string;
    model: string;
    year: number;
    fuelType?: FuelTypeEnum;
    transmission?: TransmissionEnum;
    engineCC?: number;
  }) => void;
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

  const reset = () => {
    setBrand("");
    setModel("");
    setYear("");
    setFuelType(undefined);
    setTransmission(undefined);
    setEngineCC("");
  };

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
            {Object.values(FuelTypeEnum).map((ft) => (
              <TouchableOpacity
                key={ft}
                style={[
                  styles.selectChip,
                  fuelType === ft && styles.selectChipActive,
                ]}
                onPress={() => setFuelType(fuelType === ft ? undefined : ft)}
              >
                <Text
                  style={[
                    styles.selectChipText,
                    fuelType === ft && styles.selectChipTextActive,
                  ]}
                >
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
                style={[
                  styles.selectChip,
                  transmission === tr && styles.selectChipActive,
                ]}
                onPress={() =>
                  setTransmission(transmission === tr ? undefined : tr)
                }
              >
                <Text
                  style={[
                    styles.selectChipText,
                    transmission === tr && styles.selectChipTextActive,
                  ]}
                >
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
}

export default function GarageScreen() {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const { notify } = useNotification();
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, refetch } = useGetCars();
  const createCar = useCreateCar();
  const removeCar = useDeleteCar();

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle="Garajım"
        title="Araçlarınızı yönetin"
        description="Araçlarınızı eklemek ve analiz sonuçlarını takip etmek için giriş yapın."
      />
    );
  }

  const cars = data?.results ?? [];

  const handleCreate = (payload: Parameters<typeof createCar.mutate>[0]) => {
    createCar.mutate(payload, {
      onSuccess: () => {
        setModalVisible(false);
        notify({ type: "success", title: "Araç başarıyla eklendi" });
      },
      onError: (err) => {
        notify({
          type: "error",
          title: "Araç eklenemedi",
          message: err instanceof Error ? err.message : undefined,
        });
      },
    });
  };

  const handleDelete = (id: string) => {
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
            onError: (err) => {
              notify({
                type: "error",
                title: "Araç silinemedi",
                message: err instanceof Error ? err.message : undefined,
              });
            },
          });
        },
      },
    ]);
  };

  return (
    <ScreenContainer
      title="Garajım"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
      headerRight={
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      }
    >
      {isLoading && data === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : cars.length > 0 ? (
        <View style={styles.list}>
          {cars.map((car) => (
            <CarCard key={car.id} item={car} onDelete={handleDelete} />
          ))}
        </View>
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
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Araç Ekle</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddCarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
        isLoading={createCar.isPending}
      />
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
  list: {
    gap: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
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
  },
  cardTitle: {
    fontSize: 16,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: tokens.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: tokens.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
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
