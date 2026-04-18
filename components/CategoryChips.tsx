import { tokens } from "@/constants/theme";
import { STORAGE_TYPES, WarehouseCategories } from "@/store/useWarehouse";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

const CATEGORY_ICONS: Record<
  WarehouseCategories,
  keyof typeof MaterialIcons.glyphMap
> = {
  [WarehouseCategories.STORAGE]: "inventory-2",
  [WarehouseCategories.PARKING]: "directions-car",
  [WarehouseCategories.ROOM]: "meeting-room",
  [WarehouseCategories.GARAGE]: "garage",
  [WarehouseCategories.LAND]: "landscape",
};

interface CategoryChipsProps {
  readonly selected?: WarehouseCategories;
  readonly onSelect: (category?: WarehouseCategories) => void;
}

export default function CategoryChips({
  selected,
  onSelect,
}: CategoryChipsProps) {
  const t = tokens;
  const isAllActive = selected === undefined;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "Tümü" chip */}
      <TouchableOpacity
        style={[
          styles.chip,
          isAllActive
            ? { backgroundColor: t.primary }
            : {
                backgroundColor: t.bgSurface,
                borderWidth: 1,
                borderColor: t.borderDefault,
              },
        ]}
        activeOpacity={0.8}
        onPress={() => onSelect(undefined)}
      >
        <MaterialIcons
          name="apps"
          size={18}
          color={isAllActive ? "#fff" : t.textSecondary}
        />
        <Text
          style={[
            styles.chipText,
            { color: isAllActive ? "#fff" : t.textSecondary },
            isAllActive && styles.chipTextActive,
          ]}
        >
          Tümü
        </Text>
      </TouchableOpacity>

      {STORAGE_TYPES.map((type) => {
        const isActive = selected === type.value;
        return (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: t.primary }
                : {
                    backgroundColor: t.bgSurface,
                    borderWidth: 1,
                    borderColor: t.borderDefault,
                  },
            ]}
            activeOpacity={0.8}
            onPress={() => onSelect(type.value)}
          >
            <MaterialIcons
              name={CATEGORY_ICONS[type.value]}
              size={18}
              color={isActive ? "#fff" : t.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                { color: isActive ? "#fff" : t.textSecondary },
                isActive && styles.chipTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextActive: {
    fontWeight: "700",
  },
});
