import { Colors } from "@/constants/theme";
import { useWarehousePublicById } from "@/query-hooks/useWarehoue";
import { Currency, RentOrSale } from "@/store/useWarehouse";
import { formatPrice } from "@/utils/formatPrice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CityById from "./CityById";
import DistrictById from "./DistrictById";

interface ChatWarehouseCardProps {
  readonly warehouseId: string;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.TL]: "₺",
  [Currency.DOLLAR]: "$",
  [Currency.EURO]: "€",
};

const RENT_OR_SALE_LABELS: Record<RentOrSale, string> = {
  [RentOrSale.RENT]: "Kiralık",
  [RentOrSale.SALE]: "Satılık",
};

function getPlaceholderUri(): string {
  return "https://placehold.co/400x200/3a3a3a/999?text=No+Image";
}

export default function ChatWarehouseCard({
  warehouseId,
}: ChatWarehouseCardProps) {
  const router = useRouter();
  const { data, isLoading } = useWarehousePublicById({
    id: warehouseId,
    enabled: !!warehouseId,
  });

  const warehouse = data?.result;

  if (isLoading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!warehouse) return null;

  const images = warehouse.images ?? [];
  const mainImage = images[0]?.url;
  const symbol = CURRENCY_SYMBOLS[warehouse.currency] ?? "₺";
  const priceText = warehouse.price
    ? `${symbol}${formatPrice(warehouse.price)}`
    : "Fiyat belirtilmemiş";

  const city = warehouse.address?.city;
  const district = warehouse.address?.district;
  const rentOrSaleLabel = RENT_OR_SALE_LABELS[warehouse.rentOrSale];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/warehouse/${warehouse.id}`)}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: mainImage ?? getPlaceholderUri() }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {warehouse.name ?? "İsimsiz Depo"}
        </Text>

        <Text style={styles.price} numberOfLines={1}>
          {priceText}
          {!!rentOrSaleLabel && (
            <Text style={styles.rentLabel}> · {rentOrSaleLabel}</Text>
          )}
        </Text>

        {city && district ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color="#8E8E93" />
            <CityById id={city} />
            <Text style={styles.locationSep}>/</Text>
            <DistrictById id={district} />
          </View>
        ) : null}
      </View>

      {/* Chevron */}
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E5E5EA",
    margin: 4,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  rentLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationSep: {
    color: "#8E8E93",
    fontSize: 11,
  },
  chevron: {
    paddingRight: 10,
  },
});
