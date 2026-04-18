import { Currency } from "@/store/useWarehouse";
import { formatPrice } from "@/utils/formatPrice";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker, MarkerPressEvent } from "react-native-maps";

interface PriceMarkerProps {
  readonly coordinate: {
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly price: number | null;
  readonly currency: Currency;
  readonly warehouseId: string;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.TL]: "₺",
  [Currency.DOLLAR]: "$",
  [Currency.EURO]: "€",
};

function PriceMarkerComponent({
  coordinate,
  price,
  currency,
  warehouseId,
  onPress,
  isSelected = false,
}: PriceMarkerProps) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "₺";
  const displayPrice = price ? `${symbol}${formatPrice(price)}` : symbol + "—";

  return (
    <Marker
      key={warehouseId}
      coordinate={coordinate}
      onPress={(e: MarkerPressEvent) => {
        e.stopPropagation();
        onPress?.();
      }}
      tracksViewChanges={false}
    >
      <View style={styles.wrapper}>
        <View style={[styles.bubble, isSelected && styles.bubbleSelected]}>
          <Text
            style={[styles.price, isSelected && styles.priceSelected]}
            numberOfLines={1}
          >
            {displayPrice}
          </Text>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  bubble: {
    backgroundColor: "#1A73E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bubbleSelected: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#1A73E8",
  },
  price: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  priceSelected: {
    color: "#1A73E8",
  },
});

export const PriceMarker = memo(PriceMarkerComponent);
