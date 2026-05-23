import { Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export type CarPhotoGridItem = {
    key: string;
    uri: string;
};

export default function CarPhotoGrid({
    items,
    maxItems,
    onAddPress,
    onRemovePress,
    addLabel,
    emptyTitle,
    emptyDescription,
    isBusy = false,
}: {
    items: CarPhotoGridItem[];
    maxItems: number;
    onAddPress: () => void;
    onRemovePress: (item: CarPhotoGridItem) => void;
    addLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    isBusy?: boolean;
}) {
    if (items.length === 0) {
        return (
            <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                    <MaterialIcons name="photo-library" size={26} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                <Text style={styles.emptyDescription}>{emptyDescription}</Text>
                <TouchableOpacity
                    style={[styles.addButton, isBusy && styles.addButtonDisabled]}
                    onPress={onAddPress}
                    activeOpacity={0.85}
                    disabled={isBusy}
                >
                    {isBusy ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="add-a-photo" size={18} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>{addLabel}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View>
            <View style={styles.grid}>
                {items.map((item) => (
                    <View key={item.key} style={styles.photoCard}>
                        <Image source={{ uri: item.uri }} style={styles.photo} />
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => onRemovePress(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons name="close" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                ))}
                {items.length < maxItems ? (
                    <TouchableOpacity
                        style={[styles.addTile, isBusy && styles.addTileDisabled]}
                        onPress={onAddPress}
                        activeOpacity={0.85}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <>
                                <MaterialIcons name="add-a-photo" size={22} color={Colors.primary} />
                                <Text style={styles.addTileText}>{addLabel}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : null}
            </View>
            <Text style={styles.counterText}>
                {items.length}/{maxItems}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    emptyCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        paddingHorizontal: 18,
        paddingVertical: 22,
        alignItems: "center",
    },
    emptyIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.primaryLight,
        marginBottom: 12,
    },
    emptyTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 16,
        color: tokens.textPrimary,
    },
    emptyDescription: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
        lineHeight: 20,
        color: tokens.textSecondary,
        textAlign: "center",
        marginTop: 8,
    },
    addButton: {
        marginTop: 16,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    addButtonDisabled: {
        opacity: 0.7,
    },
    addButtonText: {
        fontFamily: FontFamily.medium,
        fontSize: 14,
        color: "#FFFFFF",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    photoCard: {
        width: "48%",
        aspectRatio: 1,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: tokens.surfaceContainerLow,
        position: "relative",
    },
    photo: {
        width: "100%",
        height: "100%",
    },
    removeButton: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    addTile: {
        width: "48%",
        aspectRatio: 1,
        borderRadius: 18,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
    },
    addTileDisabled: {
        opacity: 0.7,
    },
    addTileText: {
        marginTop: 10,
        fontFamily: FontFamily.medium,
        fontSize: 13,
        color: Colors.primary,
        textAlign: "center",
    },
    counterText: {
        marginTop: 12,
        fontFamily: FontFamily.regular,
        fontSize: 12,
        color: tokens.textSecondary,
        textAlign: "right",
    },
});
