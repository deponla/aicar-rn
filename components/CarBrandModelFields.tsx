import { FontFamily, tokens } from "@/constants/theme";
import { useGetCarBrands, useGetCarModels } from "@/query-hooks/useCarBrands";
import { useDebounce } from "@/utils/useDebounce";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function normalize(value: string) {
    return value.trim().toLocaleLowerCase("tr-TR");
}

function PickerModal({
    visible,
    title,
    searchValue,
    onSearchChange,
    options,
    onSelect,
    onClose,
    placeholder,
    emptyText,
    loading,
}: {
    visible: boolean;
    title: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    options: { key: string; label: string }[];
    onSelect: (key: string) => void;
    onClose: () => void;
    placeholder: string;
    emptyText: string;
    loading?: boolean;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={22} color={tokens.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        value={searchValue}
                        onChangeText={onSearchChange}
                        placeholder={placeholder}
                        placeholderTextColor={tokens.textPlaceholder}
                    />

                    {loading ? (
                        <View style={styles.optionList}>
                            <ActivityIndicator style={{ paddingVertical: 18 }} color={tokens.textSecondary} />
                        </View>
                    ) : (
                        <LegendList
                            data={options}
                            keyExtractor={(item) => item.key}
                            estimatedItemSize={48}
                            recycleItems
                            style={styles.optionList}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={() => onSelect(item.key)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.optionText}>{item.label}</Text>
                                    <MaterialIcons
                                        name="keyboard-arrow-right"
                                        size={18}
                                        color={tokens.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function CarBrandModelFields({
    brand,
    model,
    onBrandChange,
    onModelChange,
}: {
    brand: string;
    model: string;
    onBrandChange: (value: string) => void;
    onModelChange: (value: string) => void;
}) {
    const { t } = useTranslation();
    const [brandPickerVisible, setBrandPickerVisible] = useState(false);
    const [modelPickerVisible, setModelPickerVisible] = useState(false);
    const [brandSearch, setBrandSearch] = useState("");
    const [modelSearch, setModelSearch] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState<string>();
    const [brandMode, setBrandMode] = useState<"catalog" | "manual">("catalog");
    const isInitializedRef = useRef(false);

    const debouncedBrandSearch = useDebounce(brandSearch, 300);

    const { data: brandsData, isFetching: brandsFetching } = useGetCarBrands({
        limit: 50,
        search: debouncedBrandSearch || undefined,
    });
    const brands = useMemo(() => brandsData?.results ?? [], [brandsData?.results]);

    useEffect(() => {
        if (isInitializedRef.current || brands.length === 0) {
            return;
        }

        if (!brand.trim()) {
            isInitializedRef.current = true;
            return;
        }

        const matchedBrand = brands.find(
            (item) => normalize(item.name) === normalize(brand),
        );

        const frameId = requestAnimationFrame(() => {
            if (matchedBrand) {
                setSelectedBrandId(matchedBrand.id);
                setBrandMode(matchedBrand.isOther ? "manual" : "catalog");
            } else {
                setBrandMode("manual");
            }

            isInitializedRef.current = true;
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [brand, brands]);

    const { data: modelsData, isFetching: modelsFetching } = useGetCarModels({
        brandId: selectedBrandId,
        filters: { limit: 500 },
        enabled: brandMode === "catalog" && Boolean(selectedBrandId),
    });
    const models = useMemo(() => modelsData?.results ?? [], [modelsData?.results]);

    const filteredModels = useMemo(() => {
        const search = normalize(modelSearch);
        if (!search) {
            return models;
        }

        return models.filter((item) => normalize(item.name).includes(search));
    }, [modelSearch, models]);

    const selectedBrandLabel = useMemo(() => {
        if (brandMode === "manual") {
            return t("carDetail.otherBrandOption");
        }

        return brand.trim() || t("carDetail.brandPlaceholder");
    }, [brand, brandMode, t]);

    const selectedModelLabel = useMemo(() => {
        return model.trim() || t("carDetail.modelPlaceholder");
    }, [model, t]);

    const brandOptions = useMemo(
        () => brands.map((item) => ({ key: item.id, label: item.name })),
        [brands],
    );

    const modelOptions = useMemo(
        () => filteredModels.map((item) => ({ key: item.id, label: item.name })),
        [filteredModels],
    );

    const handleSelectBrand = (brandId: string) => {
        const selectedBrand = brands.find((item) => item.id === brandId);
        if (!selectedBrand) {
            return;
        }

        setSelectedBrandId(selectedBrand.id);
        setBrandPickerVisible(false);
        setBrandSearch("");
        onModelChange("");

        if (selectedBrand.isOther) {
            setBrandMode("manual");
            onBrandChange("");
            return;
        }

        setBrandMode("catalog");
        onBrandChange(selectedBrand.name);
    };

    const handleSelectModel = (modelId: string) => {
        const selectedModel = models.find((item) => item.id === modelId);
        if (!selectedModel) {
            return;
        }

        onModelChange(selectedModel.name);
        setModelPickerVisible(false);
        setModelSearch("");
    };

    return (
        <>
            <Text style={styles.inputLabel}>{t("carDetail.brandLabel")}</Text>
            <TouchableOpacity
                style={styles.selectorInput}
                onPress={() => setBrandPickerVisible(true)}
                activeOpacity={0.85}
            >
                <Text
                    style={[
                        styles.selectorInputText,
                        !brand.trim() && brandMode !== "manual" && styles.placeholderText,
                    ]}
                >
                    {selectedBrandLabel}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={tokens.textSecondary} />
            </TouchableOpacity>

            {brandMode === "manual" ? (
                <>
                    <TextInput
                        style={styles.input}
                        value={brand}
                        onChangeText={onBrandChange}
                        placeholder={t("carDetail.manualBrandPlaceholder")}
                        placeholderTextColor={tokens.textPlaceholder}
                    />
                    <Text style={styles.inputLabel}>{t("carDetail.modelLabel")}</Text>
                    <TextInput
                        style={styles.input}
                        value={model}
                        onChangeText={onModelChange}
                        placeholder={t("carDetail.manualModelPlaceholder")}
                        placeholderTextColor={tokens.textPlaceholder}
                    />
                </>
            ) : (
                <>
                    <Text style={styles.inputLabel}>{t("carDetail.modelLabel")}</Text>
                    {selectedBrandId && models.length === 0 && !modelsFetching ? (
                        <TextInput
                            style={styles.input}
                            value={model}
                            onChangeText={onModelChange}
                            placeholder={t("carDetail.manualModelPlaceholder")}
                            placeholderTextColor={tokens.textPlaceholder}
                        />
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.selectorInput,
                                !selectedBrandId && styles.selectorInputDisabled,
                            ]}
                            onPress={() => {
                                if (selectedBrandId) {
                                    setModelPickerVisible(true);
                                }
                            }}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.selectorInputText,
                                    !model.trim() && styles.placeholderText,
                                    !selectedBrandId && styles.disabledText,
                                ]}
                            >
                                {selectedBrandId
                                    ? selectedModelLabel
                                    : t("carDetail.modelSelectBrandFirst")}
                            </Text>
                            <MaterialIcons
                                name="keyboard-arrow-down"
                                size={20}
                                color={tokens.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                </>
            )}

            <PickerModal
                visible={brandPickerVisible}
                title={t("carDetail.brandPickerTitle")}
                searchValue={brandSearch}
                onSearchChange={setBrandSearch}
                options={brandOptions}
                onSelect={handleSelectBrand}
                onClose={() => {
                    setBrandPickerVisible(false);
                    setBrandSearch("");
                }}
                placeholder={t("carDetail.brandSearchPlaceholder")}
                emptyText={t("carDetail.brandEmptyState")}
                loading={brandsFetching}
            />

            <PickerModal
                visible={modelPickerVisible}
                title={t("carDetail.modelPickerTitle")}
                searchValue={modelSearch}
                onSearchChange={setModelSearch}
                options={modelOptions}
                onSelect={handleSelectModel}
                onClose={() => {
                    setModelPickerVisible(false);
                    setModelSearch("");
                }}
                placeholder={t("carDetail.modelSearchPlaceholder")}
                emptyText={t("carDetail.modelEmptyState")}
                loading={modelsFetching}
            />
        </>
    );
}

const styles = StyleSheet.create({
    inputLabel: {
        fontFamily: FontFamily.medium,
        fontSize: 14,
        color: tokens.textPrimary,
        marginBottom: 8,
        marginTop: 14,
    },
    input: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    selectorInput: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectorInputDisabled: {
        opacity: 0.65,
    },
    selectorInputText: {
        flex: 1,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textPrimary,
        marginRight: 12,
    },
    placeholderText: {
        color: tokens.textPlaceholder,
    },
    disabledText: {
        color: tokens.textTertiary,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        borderRadius: 24,
        backgroundColor: tokens.surfaceContainerLowest,
        padding: 18,
        maxHeight: "75%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    modalTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 18,
        color: tokens.textPrimary,
    },
    searchInput: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    optionList: {
        marginTop: 14,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderSubtle,
    },
    optionText: {
        flex: 1,
        fontFamily: FontFamily.medium,
        fontSize: 15,
        color: tokens.textPrimary,
        marginRight: 12,
    },
    emptyText: {
        paddingVertical: 18,
        fontFamily: FontFamily.regular,
        fontSize: 14,
        color: tokens.textSecondary,
        textAlign: "center",
    },
});
