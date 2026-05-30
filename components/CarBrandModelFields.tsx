import { useNotification } from "@/components/Notification";
import { FontFamily, tokens } from "@/constants/theme";
import { useGetCarBrands, useGetCarEngines, useGetCarModels } from "@/query-hooks/useCarBrands";
import { useDebounce } from "@/utils/useDebounce";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
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
    options: { key: string; label: string; logo?: string }[];
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
                            initialContainerPoolRatio={4}
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
                                    {item.logo ? (
                                        <Image source={{ uri: item.logo }} style={styles.optionLogo} />
                                    ) : null}
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
    engine,
    onBrandChange,
    onModelChange,
    onEngineChange,
}: {
    brand: string;
    model: string;
    engine?: string;
    onBrandChange: (value: string) => void;
    onModelChange: (value: string) => void;
    onEngineChange?: (value: string) => void;
}) {
    const { t } = useTranslation();
    const { notify } = useNotification();
    const [brandPickerVisible, setBrandPickerVisible] = useState(false);
    const [modelPickerVisible, setModelPickerVisible] = useState(false);
    const [enginePickerVisible, setEnginePickerVisible] = useState(false);
    const [brandSearch, setBrandSearch] = useState("");
    const [modelSearch, setModelSearch] = useState("");
    const [engineSearch, setEngineSearch] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState<string>();
    const [selectedCatalogModelId, setSelectedCatalogModelId] = useState<string>();
    const [selectedModelHasEngines, setSelectedModelHasEngines] = useState(false);
    const [brandMode, setBrandMode] = useState<"catalog" | "manual">("catalog");
    const isInitializedRef = useRef(false);
    const lastModelErrorRef = useRef<string | undefined>(undefined);

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

    const {
        data: modelsData,
        error: modelsError,
        isError: hasModelsError,
        isFetching: modelsFetching,
        isLoading: modelsLoading,
    } = useGetCarModels({
        brandId: selectedBrandId,
        filters: { limit: 500 },
        enabled: brandMode === "catalog" && Boolean(selectedBrandId),
    });
    const models = useMemo(() => modelsData?.results ?? [], [modelsData?.results]);

    // Engine data
    const {
        data: enginesData,
        isFetching: enginesFetching,
    } = useGetCarEngines({
        catalogModelId: selectedCatalogModelId,
        enabled: selectedModelHasEngines && Boolean(selectedCatalogModelId),
    });
    const engines = useMemo(() => enginesData?.results ?? [], [enginesData?.results]);

    useEffect(() => {
        if (!hasModelsError) {
            lastModelErrorRef.current = undefined;
            return;
        }

        const message =
            modelsError instanceof Error && modelsError.message
                ? modelsError.message
                : t("common.requestFailed");

        if (lastModelErrorRef.current === message) {
            return;
        }

        lastModelErrorRef.current = message;
        setModelPickerVisible(false);
        setModelSearch("");
        notify({
            type: "error",
            title: t("common.error"),
            message,
        });
    }, [hasModelsError, modelsError, notify, t]);

    const filteredModels = useMemo(() => {
        const search = normalize(modelSearch);
        if (!search) {
            return models;
        }

        return models.filter((item) => normalize(item.name).includes(search));
    }, [modelSearch, models]);

    const filteredEngines = useMemo(() => {
        const search = normalize(engineSearch);
        if (!search) {
            return engines;
        }

        return engines.filter((item) => normalize(item.name).includes(search));
    }, [engineSearch, engines]);

    const selectedBrandLabel = useMemo(() => {
        if (brandMode === "manual") {
            return t("carDetail.otherBrandOption");
        }

        return brand.trim() || t("carDetail.brandPlaceholder");
    }, [brand, brandMode, t]);

    const selectedModelLabel = useMemo(() => {
        return model.trim() || t("carDetail.modelPlaceholder");
    }, [model, t]);

    const selectedEngineLabel = useMemo(() => {
        return engine?.trim() || t("carDetail.enginePlaceholder");
    }, [engine, t]);

    // Find logo for selected brand
    const selectedBrandLogo = useMemo(() => {
        if (!selectedBrandId) return undefined;
        const found = brands.find((item) => item.id === selectedBrandId);
        return found?.logo;
    }, [selectedBrandId, brands]);

    const brandOptions = useMemo(
        () => brands.map((item) => ({ key: item.id, label: item.name, logo: item.logo })),
        [brands],
    );

    const modelOptions = useMemo(
        () => filteredModels.map((item) => ({ key: item.id, label: item.name })),
        [filteredModels],
    );

    const engineOptions = useMemo(
        () => filteredEngines.map((item) => ({ key: item.id, label: item.name })),
        [filteredEngines],
    );

    const shouldUseManualModelInput = Boolean(selectedBrandId) &&
        !modelsLoading && !modelsFetching &&
        (hasModelsError || models.length === 0);

    const handleSelectBrand = (brandId: string) => {
        const selectedBrand = brands.find((item) => item.id === brandId);
        if (!selectedBrand) {
            return;
        }

        setSelectedBrandId(selectedBrand.id);
        setBrandPickerVisible(false);
        setBrandSearch("");
        onModelChange("");
        setSelectedCatalogModelId(undefined);
        setSelectedModelHasEngines(false);
        onEngineChange?.("");

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

        // Reset engine state and set up engine picker if available
        onEngineChange?.("");
        setSelectedCatalogModelId(selectedModel.catalogModelId);
        setSelectedModelHasEngines(selectedModel.hasEngines === true);
    };

    const handleSelectEngine = (engineId: string) => {
        const selectedEngine = engines.find((item) => item.id === engineId);
        if (!selectedEngine) {
            return;
        }

        onEngineChange?.(selectedEngine.name);
        setEnginePickerVisible(false);
        setEngineSearch("");
    };

    return (
        <>
            <Text style={styles.inputLabel}>{t("carDetail.brandLabel")}</Text>
            <TouchableOpacity
                style={styles.selectorInput}
                onPress={() => setBrandPickerVisible(true)}
                activeOpacity={0.85}
            >
                {selectedBrandLogo ? (
                    <Image source={{ uri: selectedBrandLogo }} style={styles.brandLogo} />
                ) : null}
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
                    {shouldUseManualModelInput ? (
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

                    {/* Engine selector — shown only when model has engine data */}
                    {selectedModelHasEngines && selectedCatalogModelId && onEngineChange ? (
                        <>
                            <Text style={styles.inputLabel}>{t("carDetail.engineLabel")}</Text>
                            <TouchableOpacity
                                style={styles.selectorInput}
                                onPress={() => setEnginePickerVisible(true)}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.selectorInputText,
                                        !engine?.trim() && styles.placeholderText,
                                    ]}
                                >
                                    {selectedEngineLabel}
                                </Text>
                                <MaterialIcons
                                    name="keyboard-arrow-down"
                                    size={20}
                                    color={tokens.textSecondary}
                                />
                            </TouchableOpacity>
                        </>
                    ) : null}
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

            <PickerModal
                visible={enginePickerVisible}
                title={t("carDetail.enginePickerTitle")}
                searchValue={engineSearch}
                onSearchChange={setEngineSearch}
                options={engineOptions}
                onSelect={handleSelectEngine}
                onClose={() => {
                    setEnginePickerVisible(false);
                    setEngineSearch("");
                }}
                placeholder={t("carDetail.engineSearchPlaceholder")}
                emptyText={t("carDetail.engineEmptyState")}
                loading={enginesFetching}
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
    brandLogo: {
        width: 24,
        height: 24,
        borderRadius: 4,
        marginRight: 10,
        resizeMode: "contain",
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
        minHeight: 64,
        maxHeight: 360,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: tokens.borderSubtle,
    },
    optionLogo: {
        width: 22,
        height: 22,
        borderRadius: 3,
        marginRight: 10,
        resizeMode: "contain",
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
