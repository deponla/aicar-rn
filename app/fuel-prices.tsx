import ScreenContainer from "@/components/ScreenContainer";
import { Colors, FontFamily, Radius, Spacing, tokens } from "@/constants/theme";
import { useGetFuelPrices, useGetFuelPriceSummary } from "@/query-hooks/useFuelPrices";
import { CitySummaryItem, FuelPriceItem, FuelType, StationPrice } from "@/types/fuel-price";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const FUEL_TYPES = [undefined, FuelType.GASOLINE, FuelType.DIESEL, FuelType.LPG] as const;

function getFuelIcon(fuelType: FuelType): keyof typeof MaterialIcons.glyphMap {
    switch (fuelType) {
        case FuelType.GASOLINE:
            return "local-gas-station";
        case FuelType.DIESEL:
            return "local-gas-station";
        case FuelType.LPG:
            return "propane-tank";
        default:
            return "local-gas-station";
    }
}

function getFuelColor(fuelType: FuelType): string {
    switch (fuelType) {
        case FuelType.GASOLINE:
            return "#E74C3C";
        case FuelType.DIESEL:
            return "#F39C12";
        case FuelType.LPG:
            return "#27AE60";
        default:
            return tokens.textSecondary;
    }
}

export default function FuelPricesScreen() {
    const { t } = useTranslation();
    const [selectedCity, setSelectedCity] = useState<string | undefined>();
    const [selectedFuelType, setSelectedFuelType] = useState<FuelType | undefined>();
    const [searchQuery, setSearchQuery] = useState("");

    const {
        data: summaryData,
        isLoading: summaryLoading,
        refetch: refetchSummary,
    } = useGetFuelPriceSummary();

    const {
        data: cityData,
        isLoading: cityLoading,
        refetch: refetchCity,
    } = useGetFuelPrices(
        selectedCity ? { city: selectedCity, fuelType: selectedFuelType } : undefined,
        { enabled: !!selectedCity },
    );

    const isLoading = summaryLoading || cityLoading;

    const filteredCities = useMemo(() => {
        if (!summaryData?.results) return [];
        if (!searchQuery.trim()) return summaryData.results;
        const query = searchQuery.toLocaleLowerCase("tr-TR");
        return summaryData.results.filter((item) =>
            item.city.toLocaleLowerCase("tr-TR").includes(query),
        );
    }, [summaryData, searchQuery]);

    const handleRefresh = useCallback(() => {
        if (selectedCity) {
            refetchCity();
        }
        refetchSummary();
    }, [selectedCity, refetchCity, refetchSummary]);

    const handleCitySelect = useCallback((city: string) => {
        setSelectedCity((prev) => (prev === city ? undefined : city));
        setSelectedFuelType(undefined);
    }, []);

    const handleFuelTypeFilter = useCallback((type: FuelType | undefined) => {
        setSelectedFuelType(type);
    }, []);

    const handleBack = useCallback(() => {
        setSelectedCity(undefined);
        setSelectedFuelType(undefined);
        setSearchQuery("");
    }, []);

    return (
        <ScreenContainer title={t("fuelPrices.title")} showBackButton>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={false} onRefresh={handleRefresh} />
                }
            >
                {/* Fuel type filter tabs */}
                {selectedCity && (
                    <>
                        <TouchableOpacity style={styles.backToList} onPress={handleBack}>
                            <MaterialIcons name="arrow-back" size={18} color={Colors.primary} />
                            <Text style={styles.backToListText}>
                                {selectedCity.charAt(0).toLocaleUpperCase("tr-TR") + selectedCity.slice(1)}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.filterRow}>
                            {FUEL_TYPES.map((type) => {
                                const isActive = selectedFuelType === type;
                                return (
                                    <TouchableOpacity
                                        key={type ?? "all"}
                                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                                        onPress={() => handleFuelTypeFilter(type)}
                                    >
                                        <Text
                                            style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                                        >
                                            {type
                                                ? t(`fuelPrices.${type}`)
                                                : t("fuelPrices.allFuels")}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                )}

                {/* Search bar (only for summary view) */}
                {!selectedCity && (
                    <View style={styles.searchContainer}>
                        <MaterialIcons name="search" size={20} color={tokens.textTertiary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t("fuelPrices.searchCity")}
                            placeholderTextColor={tokens.textPlaceholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <MaterialIcons name="close" size={18} color={tokens.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {isLoading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}

                {/* City detail view */}
                {selectedCity && !cityLoading && cityData?.results && (
                    <CityDetailView
                        prices={cityData.results}
                        t={t}
                    />
                )}

                {/* Summary list view */}
                {!selectedCity && !summaryLoading && (
                    <>
                        {filteredCities.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="local-gas-station" size={48} color={tokens.textTertiary} />
                                <Text style={styles.emptyTitle}>{t("fuelPrices.noData")}</Text>
                                <Text style={styles.emptyDescription}>
                                    {t("fuelPrices.noDataDescription")}
                                </Text>
                            </View>
                        ) : (
                            filteredCities.map((item) => (
                                <CityCard
                                    key={item.city}
                                    item={item}
                                    onPress={handleCitySelect}
                                    t={t}
                                />
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </ScreenContainer>
    );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CityCard({
    item,
    onPress,
    t,
}: {
    item: CitySummaryItem;
    onPress: (city: string) => void;
    t: (key: string, opts?: Record<string, unknown>) => string;
}) {
    const cityLabel = item.city.charAt(0).toLocaleUpperCase("tr-TR") + item.city.slice(1);

    return (
        <TouchableOpacity
            style={styles.cityCard}
            onPress={() => onPress(item.city)}
            activeOpacity={0.7}
        >
            <View style={styles.cityCardHeader}>
                <Text style={styles.cityName}>{cityLabel}</Text>
                <MaterialIcons name="chevron-right" size={20} color={tokens.textTertiary} />
            </View>

            <View style={styles.cityCardPrices}>
                {item.gasoline != null && (
                    <PriceBadge
                        label={t("fuelPrices.gasoline")}
                        value={item.gasoline}
                        color={getFuelColor(FuelType.GASOLINE)}
                        t={t}
                    />
                )}
                {item.diesel != null && (
                    <PriceBadge
                        label={t("fuelPrices.diesel")}
                        value={item.diesel}
                        color={getFuelColor(FuelType.DIESEL)}
                        t={t}
                    />
                )}
                {item.lpg != null && (
                    <PriceBadge
                        label={t("fuelPrices.lpg")}
                        value={item.lpg}
                        color={getFuelColor(FuelType.LPG)}
                        t={t}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

function PriceBadge({
    label,
    value,
    color,
    t,
}: {
    label: string;
    value: number;
    color: string;
    t: (key: string) => string;
}) {
    return (
        <View style={[styles.priceBadge, { backgroundColor: color + "14" }]}>
            <Text style={[styles.priceBadgeLabel, { color }]}>{label}</Text>
            <Text style={[styles.priceBadgeValue, { color }]}>
                {value.toFixed(2)} {t("fuelPrices.perLiter")}
            </Text>
        </View>
    );
}

function CityDetailView({
    prices,
    t,
}: {
    prices: FuelPriceItem[];
    t: (key: string, opts?: Record<string, unknown>) => string;
}) {
    return (
        <View style={styles.detailContainer}>
            {prices.map((fuelPrice) => (
                <View key={fuelPrice.fuelType} style={styles.fuelSection}>
                    <View style={styles.fuelSectionHeader}>
                        <MaterialIcons
                            name={getFuelIcon(fuelPrice.fuelType)}
                            size={22}
                            color={getFuelColor(fuelPrice.fuelType)}
                        />
                        <Text style={styles.fuelSectionTitle}>
                            {t(`fuelPrices.${fuelPrice.fuelType}`)}
                        </Text>
                    </View>

                    {/* Summary stats */}
                    {(fuelPrice.minPrice != null || fuelPrice.maxPrice != null || fuelPrice.avgPrice != null) && (
                        <View style={styles.statsRow}>
                            {fuelPrice.minPrice != null && (
                                <StatBox
                                    label={t("fuelPrices.cheapest")}
                                    value={fuelPrice.minPrice}
                                    color={tokens.success}
                                />
                            )}
                            {fuelPrice.avgPrice != null && (
                                <StatBox
                                    label={t("fuelPrices.average")}
                                    value={fuelPrice.avgPrice}
                                    color={tokens.info}
                                />
                            )}
                            {fuelPrice.maxPrice != null && (
                                <StatBox
                                    label={t("fuelPrices.mostExpensive")}
                                    value={fuelPrice.maxPrice}
                                    color={tokens.danger}
                                />
                            )}
                        </View>
                    )}

                    {/* Station list */}
                    <View style={styles.stationList}>
                        {fuelPrice.stations
                            .slice()
                            .sort((a, b) => a.price - b.price)
                            .map((station, index) => (
                                <StationRow
                                    key={`${station.brand}-${index}`}
                                    station={station}
                                    isLowest={index === 0}
                                    t={t}
                                />
                            ))}
                    </View>
                </View>
            ))}
        </View>
    );
}

function StatBox({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <View style={[styles.statBox, { borderColor: color + "30" }]}>
            <Text style={[styles.statLabel, { color }]}>{label}</Text>
            <Text style={[styles.statValue, { color }]}>{value.toFixed(2)} ₺</Text>
        </View>
    );
}

function StationRow({
    station,
    isLowest,
    t,
}: {
    station: StationPrice;
    isLowest: boolean;
    t: (key: string) => string;
}) {
    return (
        <View style={[styles.stationRow, isLowest && styles.stationRowHighlight]}>
            <View style={styles.stationInfo}>
                <Text style={styles.stationBrand}>{station.brand}</Text>
                {isLowest && (
                    <View style={styles.lowestBadge}>
                        <Text style={styles.lowestBadgeText}>{t("fuelPrices.cheapest")}</Text>
                    </View>
                )}
            </View>
            <View style={styles.stationPrices}>
                <Text style={styles.stationPrice}>{station.price.toFixed(2)} ₺</Text>
                {station.premiumPrice != null && (
                    <Text style={styles.stationPremiumPrice}>
                        {t("fuelPrices.premium")}: {station.premiumPrice.toFixed(2)} ₺
                    </Text>
                )}
            </View>
        </View>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.gutter,
        paddingBottom: 40,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: tokens.bgElevated,
        borderRadius: Radius.lg,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: Spacing.gutter,
        borderWidth: 1,
        borderColor: tokens.glassStrokeMuted,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    loaderContainer: {
        paddingVertical: 60,
        alignItems: "center",
    },
    filterRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: Spacing.gutter,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radius.xl,
        backgroundColor: tokens.bgSubtle,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
    },
    filterChipText: {
        fontFamily: FontFamily.medium,
        fontSize: 13,
        color: tokens.textSecondary,
    },
    filterChipTextActive: {
        color: tokens.textInverse,
    },
    backToList: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },
    backToListText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 16,
        color: Colors.primary,
    },

    // City card
    cityCard: {
        backgroundColor: tokens.bgElevated,
        borderRadius: Radius.xl,
        padding: Spacing.gutter,
        marginBottom: Spacing.cardGap,
        borderWidth: 1,
        borderColor: tokens.glassStrokeMuted,
    },
    cityCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    cityName: {
        fontFamily: FontFamily.semiBold,
        fontSize: 16,
        color: tokens.textPrimary,
    },
    cityCardPrices: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    priceBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radius.md,
    },
    priceBadgeLabel: {
        fontFamily: FontFamily.medium,
        fontSize: 12,
    },
    priceBadgeValue: {
        fontFamily: FontFamily.bold,
        fontSize: 13,
    },

    // Detail
    detailContainer: {
        gap: Spacing.gutter,
    },
    fuelSection: {
        backgroundColor: tokens.bgElevated,
        borderRadius: Radius.xl,
        padding: Spacing.gutter,
        borderWidth: 1,
        borderColor: tokens.glassStrokeMuted,
    },
    fuelSectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    fuelSectionTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 18,
        color: tokens.textPrimary,
    },
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },
    statBox: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: Radius.lg,
        borderWidth: 1,
        backgroundColor: tokens.bgSubtle,
    },
    statLabel: {
        fontFamily: FontFamily.medium,
        fontSize: 11,
        marginBottom: 2,
    },
    statValue: {
        fontFamily: FontFamily.bold,
        fontSize: 15,
    },
    stationList: {
        gap: 2,
    },
    stationRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: Radius.md,
    },
    stationRowHighlight: {
        backgroundColor: "#27AE6010",
    },
    stationInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    stationBrand: {
        fontFamily: FontFamily.medium,
        fontSize: 14,
        color: tokens.textPrimary,
    },
    lowestBadge: {
        backgroundColor: "#27AE6020",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    lowestBadgeText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 10,
        color: "#27AE60",
    },
    stationPrices: {
        alignItems: "flex-end",
    },
    stationPrice: {
        fontFamily: FontFamily.bold,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    stationPremiumPrice: {
        fontFamily: FontFamily.regular,
        fontSize: 12,
        color: tokens.textTertiary,
        marginTop: 2,
    },

    // Empty state
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 60,
        gap: 8,
    },
    emptyTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 16,
        color: tokens.textSecondary,
        marginTop: 8,
    },
    emptyDescription: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        color: tokens.textTertiary,
        textAlign: "center",
        paddingHorizontal: 40,
    },
});
