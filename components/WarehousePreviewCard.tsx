import {
  Currency,
  RentOrSale,
  STORAGE_TYPES,
  WarehouseCategories,
} from "@/store/useWarehouse";
import { Warehouse } from "@/types/warehouse";
import { formatPrice } from "@/utils/formatPrice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CityById from "./CityById";
import DistrictById from "./DistrictById";

interface WarehousePreviewCardProps {
  readonly warehouse: Warehouse;
  readonly onClose?: () => void;
  readonly onPress?: () => void;
  readonly containerStyle?: import("react-native").ViewStyle;
}

const IMAGE_SIZE = 100;
const SMALL_IMAGE_SIZE = (IMAGE_SIZE - 3) / 2;

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.TL]: "₺",
  [Currency.DOLLAR]: "$",
  [Currency.EURO]: "€",
};

const RENT_OR_SALE_LABELS: Record<RentOrSale, string> = {
  [RentOrSale.RENT]: "Kiralık",
  [RentOrSale.SALE]: "Satılık",
};

function getStorageLabel(type: WarehouseCategories): string {
  return STORAGE_TYPES.find((s) => s.value === type)?.label ?? type;
}

function getPlaceholderUri(): string {
  return "https://placehold.co/200x200/3a3a3a/999?text=No+Image";
}

export default function WarehousePreviewCard({
  warehouse,
  onClose,
  onPress,
  containerStyle,
}: WarehousePreviewCardProps) {
  const images = warehouse.images ?? [];
  const imageCount = images.length;
  const img0 = images[0]?.url;
  const img1 = images[1]?.url;
  const img2 = images[2]?.url;

  const symbol = CURRENCY_SYMBOLS[warehouse.currency] ?? "₺";
  const priceText = warehouse.price
    ? `${symbol}${formatPrice(warehouse.price)}`
    : "Fiyat belirtilmemiş";

  const city = warehouse.address?.city;
  const district = warehouse.address?.district;

  const rentOrSaleLabel = RENT_OR_SALE_LABELS[warehouse.rentOrSale];

  const storageLabels = warehouse.storageType?.map(getStorageLabel).join(", ");

  const indoorArea = warehouse.indoorAreaSize;
  const outdoorArea = warehouse.outdoorAreaSize;

  const router = useRouter();

  const areaText = [
    indoorArea ? `${indoorArea} m²` : null,
    outdoorArea ? `${outdoorArea} m² dış` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/warehouse/${warehouse.id}`);
    }
  };

  const renderImages = () => {
    if (imageCount <= 1) {
      return (
        <Image
          source={{ uri: img0 ?? getPlaceholderUri() }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      );
    }
    if (imageCount === 2) {
      return (
        <View style={styles.twoImagesRow}>
          <Image
            source={{ uri: img0 ?? getPlaceholderUri() }}
            style={styles.halfImage}
            resizeMode="cover"
          />
          <Image
            source={{ uri: img1 ?? getPlaceholderUri() }}
            style={styles.halfImage}
            resizeMode="cover"
          />
        </View>
      );
    }
    return (
      <>
        <Image
          source={{ uri: img0 ?? getPlaceholderUri() }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        <View style={styles.smallImagesRow}>
          <Image
            source={{ uri: img1 ?? getPlaceholderUri() }}
            style={styles.smallImage}
            resizeMode="cover"
          />
          <Image
            source={{ uri: img2 ?? getPlaceholderUri() }}
            style={styles.smallImage}
            resizeMode="cover"
          />
        </View>
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, containerStyle]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      {/* Left: Images */}
      <View style={styles.imagesColumn}>{renderImages()}</View>

      {/* Right: Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {warehouse.name ?? "İsimsiz Depo"}
        </Text>

        <Text style={styles.price}>{priceText}</Text>

        {city && district ? (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={12} color="#999" />
            <CityById id={city} />
            <Text style={{ color: "#999" }}>/</Text>
            <DistrictById id={district} />
          </View>
        ) : null}

        <View style={styles.tagsRow}>
          {rentOrSaleLabel ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{rentOrSaleLabel}</Text>
            </View>
          ) : null}
          {storageLabels ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{storageLabels}</Text>
            </View>
          ) : null}
          {areaText ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{areaText}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Close */}
      {onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="#999" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  imagesColumn: {
    width: IMAGE_SIZE,
    gap: 3,
  },
  singleImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE + SMALL_IMAGE_SIZE + 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  twoImagesRow: {
    flexDirection: "row",
    gap: 3,
    height: IMAGE_SIZE + SMALL_IMAGE_SIZE + 3,
  },
  halfImage: {
    width: SMALL_IMAGE_SIZE,
    height: IMAGE_SIZE + SMALL_IMAGE_SIZE + 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  mainImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderTopLeftRadius: 14,
  },
  smallImagesRow: {
    flexDirection: "row",
    gap: 3,
  },
  smallImage: {
    width: SMALL_IMAGE_SIZE,
    height: SMALL_IMAGE_SIZE,
  },
  infoContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    paddingRight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A73E8",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 10,
    color: "#555",
    fontWeight: "500",
  },
  closeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
