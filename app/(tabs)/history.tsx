import { Colors, tokens } from "@/constants/theme";
import LoginRequired from "@/components/LoginRequired";
import ScreenContainer from "@/components/ScreenContainer";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import {
  Aicar,
  AicarFuelType,
  AicarStatus,
  AicarTransmission,
  Currency,
} from "@/types/aicar";
import { useGetMyAicars } from "@/query-hooks/useAicars";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { formatPrice } from "@/utils/formatPrice";

const STATUS_META: Record<
  AicarStatus,
  { label: string; bg: string; text: string }
> = {
  [AicarStatus.ACTIVE]: {
    label: "Aktif",
    bg: tokens.successBg,
    text: tokens.successText,
  },
  [AicarStatus.DRAFT]: {
    label: "Taslak",
    bg: tokens.bgMuted,
    text: tokens.textSecondary,
  },
  [AicarStatus.PENDING]: {
    label: "Beklemede",
    bg: tokens.warningBg,
    text: tokens.warningText,
  },
  [AicarStatus.INACTIVE]: {
    label: "Pasif",
    bg: tokens.bgMuted,
    text: tokens.textSecondary,
  },
  [AicarStatus.REJECTED]: {
    label: "Reddedildi",
    bg: tokens.dangerBg,
    text: tokens.dangerText,
  },
};

const FUEL_LABELS: Record<AicarFuelType, string> = {
  [AicarFuelType.GASOLINE]: "Benzin",
  [AicarFuelType.DIESEL]: "Dizel",
  [AicarFuelType.LPG]: "LPG",
  [AicarFuelType.ELECTRIC]: "Elektrik",
  [AicarFuelType.HYBRID]: "Hibrit",
};

const TRANSMISSION_LABELS: Record<AicarTransmission, string> = {
  [AicarTransmission.MANUAL]: "Manuel",
  [AicarTransmission.AUTOMATIC]: "Otomatik",
  [AicarTransmission.SEMI_AUTOMATIC]: "Yarı Otomatik",
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.TRY]: "₺",
  [Currency.USD]: "$",
  [Currency.EUR]: "€",
};

function AicarCard({ item }: { item: Aicar }) {
  const status = STATUS_META[item.status];
  const thumbnail = item.images?.[0]?.url;

  return (
    <View style={styles.card}>
      {thumbnail && (
        <Image source={{ uri: thumbnail }} style={styles.cardImage} />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name ??
              [item.brand, item.model, item.year].filter(Boolean).join(" ") ||
              "İlan"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusBadgeText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          {item.year != null && (
            <View style={styles.detailChip}>
              <MaterialIcons
                name="calendar-today"
                size={12}
                color={tokens.textSecondary}
              />
              <Text style={styles.detailText}>{item.year}</Text>
            </View>
          )}
          {item.mileage != null && (
            <View style={styles.detailChip}>
              <MaterialIcons
                name="speed"
                size={12}
                color={tokens.textSecondary}
              />
              <Text style={styles.detailText}>
                {item.mileage.toLocaleString("tr-TR")} km
              </Text>
            </View>
          )}
          {item.fuelType && (
            <View style={styles.detailChip}>
              <Text style={styles.detailText}>
                {FUEL_LABELS[item.fuelType]}
              </Text>
            </View>
          )}
          {item.transmission && (
            <View style={styles.detailChip}>
              <Text style={styles.detailText}>
                {TRANSMISSION_LABELS[item.transmission]}
              </Text>
            </View>
          )}
        </View>

        {item.price != null && (
          <Text style={styles.priceText}>
            {formatPrice(item.price)}{" "}
            {item.currency
              ? CURRENCY_SYMBOLS[item.currency] ?? item.currency
              : "₺"}
          </Text>
        )}

        {item.address && (
          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={14}
              color={tokens.textTertiary}
            />
            <Text style={styles.locationText}>
              {[item.address.district, item.address.city]
                .filter(Boolean)
                .join(", ")}
            </Text>
          </View>
        )}

        <Text style={styles.dateText}>
          {dayjs(item.createdAt).format("DD.MM.YYYY")}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;

  const { data, isLoading, refetch } = useGetMyAicars({
    limit: 50,
    sort: "createdAt:desc",
  });

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle="Geçmiş"
        title="Analiz geçmişinizi görüntüleyin"
        description="Geçmiş analiz sonuçlarınızı takip etmek için giriş yapın."
      />
    );
  }

  const aicars = data?.results ?? [];

  return (
    <ScreenContainer
      title="Analiz Geçmişi"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {isLoading && data === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : aicars.length > 0 ? (
        <View style={styles.list}>
          {aicars.map((item) => (
            <AicarCard key={item.id} item={item} />
          ))}
          {typeof data?.count === "number" && data.count > aicars.length && (
            <Text style={styles.helperText}>
              En son {aicars.length} kayıt gösteriliyor.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="history"
            size={64}
            color={tokens.textTertiary}
          />
          <Text style={styles.emptyTitle}>Henüz analiz yapılmadı</Text>
          <Text style={styles.emptySubtitle}>
            Araç taraması yaptığınızda sonuçlarınız burada görünecek.
          </Text>
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
  list: {
    gap: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: tokens.bgMuted,
  },
  cardBody: {
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: tokens.bgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 12,
    color: tokens.textSecondary,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: tokens.textTertiary,
  },
  dateText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  helperText: {
    fontSize: 13,
    color: tokens.textTertiary,
    textAlign: "center",
    marginTop: 4,
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
});
