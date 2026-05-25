import { FontFamily, tokens } from "@/constants/theme";
import { getSelectableCarYears } from "@/utils/carYears";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import React, { useMemo, useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CarYearField({
    value,
    onChange,
    placeholder,
    title,
    legacyValue,
}: {
    value?: number;
    onChange: (year: number) => void;
    placeholder: string;
    title: string;
    legacyValue?: number;
}) {
    const [visible, setVisible] = useState(false);

    const options = useMemo(
        () =>
            getSelectableCarYears([legacyValue]).map((year) => ({
                key: String(year),
                value: year,
                label: String(year),
            })),
        [legacyValue],
    );

    return (
        <>
            <TouchableOpacity
                style={styles.selectorInput}
                onPress={() => setVisible(true)}
                activeOpacity={0.85}
            >
                <Text
                    style={[
                        styles.selectorInputText,
                        value == null && styles.placeholderText,
                    ]}
                >
                    {value != null ? String(value) : placeholder}
                </Text>
                <MaterialIcons
                    name="keyboard-arrow-down"
                    size={20}
                    color={tokens.textSecondary}
                />
            </TouchableOpacity>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <MaterialIcons
                                    name="close"
                                    size={22}
                                    color={tokens.textPrimary}
                                />
                            </TouchableOpacity>
                        </View>

                        <LegendList
                            data={options}
                            keyExtractor={(item) => item.key}
                            estimatedItemSize={52}
                            initialContainerPoolRatio={4}
                            recycleItems
                            style={styles.optionList}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const isSelected = item.value === value;

                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            isSelected && styles.optionButtonSelected,
                                        ]}
                                        onPress={() => {
                                            onChange(item.value);
                                            setVisible(false);
                                        }}
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                isSelected && styles.optionTextSelected,
                                            ]}
                                        >
                                            {item.label}
                                        </Text>
                                        <MaterialIcons
                                            name={isSelected ? "check" : "keyboard-arrow-right"}
                                            size={18}
                                            color={
                                                isSelected ? tokens.primary : tokens.textSecondary
                                            }
                                        />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    selectorInput: {
        minHeight: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    selectorInputText: {
        flex: 1,
        color: tokens.textPrimary,
        fontSize: 15,
        fontFamily: FontFamily.medium,
    },
    placeholderText: {
        color: tokens.textPlaceholder,
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
        marginBottom: 12,
    },
    modalTitle: {
        flex: 1,
        color: tokens.textPrimary,
        fontSize: 18,
        fontFamily: FontFamily.semiBold,
    },
    optionList: {
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
    optionButtonSelected: {
        backgroundColor: tokens.primaryLight,
    },
    optionText: {
        flex: 1,
        color: tokens.textPrimary,
        fontSize: 15,
        fontFamily: FontFamily.medium,
        marginRight: 12,
    },
    optionTextSelected: {
        color: tokens.primary,
        fontFamily: FontFamily.semiBold,
    },
});
