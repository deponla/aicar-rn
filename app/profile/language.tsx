import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { usePatchUsers } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const LANGUAGES = [
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export default function LanguageScreen() {
    const authStore = useAuthStore();
    const user = authStore.user?.user;
    const { notify } = useNotification();
    const patchUser = usePatchUsers();
    const t = tokens;

    const [selectedLang, setSelectedLang] = useState(
        user?.language?.toLowerCase() || "tr",
    );
    const [isSaving, setIsSaving] = useState(false);

    if (!user) {
        return (
            <ScreenContainer title="Dil / Language" showBackButton>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
                    <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
                </View>
            </ScreenContainer>
        );
    }

    const currentLang = user.language?.toLowerCase() || "tr";
    const hasChanged = selectedLang !== currentLang;

    const handleSave = async () => {
        if (!hasChanged) return;

        try {
            setIsSaving(true);
            await patchUser.mutateAsync({
                id: user.id,
                d: { language: selectedLang },
            });

            if (authStore.user) {
                authStore.login({
                    ...authStore.user,
                    user: { ...authStore.user.user, language: selectedLang },
                });
            }

            notify({ type: "success", title: "Dil tercihi kaydedildi" });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            notify({
                type: "error",
                title: "Dil değiştirilemedi",
                message: err?.response?.data?.message || "Lütfen tekrar deneyin.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScreenContainer title="Dil / Language" showBackButton>
            <View style={styles.infoCard}>
                <MaterialIcons name="translate" size={20} color={t.infoText} />
                <Text style={[styles.infoText, { color: t.infoText }]}>
                    Uygulama dili ve bildirim dilini değiştirmek için bir dil seçin.
                </Text>
            </View>

            <View style={styles.languageList}>
                {LANGUAGES.map((lang) => {
                    const isSelected = selectedLang === lang.code;
                    return (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.languageItem,
                                {
                                    backgroundColor: t.bgSurface,
                                    borderColor: isSelected
                                        ? Colors.primary + "60"
                                        : t.borderDefault,
                                    borderWidth: isSelected ? 2 : 1,
                                },
                            ]}
                            onPress={() => setSelectedLang(lang.code)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.flag}>{lang.flag}</Text>
                            <Text
                                style={[
                                    styles.languageLabel,
                                    {
                                        color: t.textPrimary,
                                        fontWeight: isSelected ? "700" : "500",
                                    },
                                ]}
                            >
                                {lang.label}
                            </Text>
                            <View style={styles.radioOuter}>
                                {isSelected && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={24}
                                        color={Colors.primary}
                                    />
                                )}
                                {!isSelected && (
                                    <MaterialIcons
                                        name="radio-button-unchecked"
                                        size={24}
                                        color={t.textPlaceholder}
                                    />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    (!hasChanged || isSaving) && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={!hasChanged || isSaving}
                activeOpacity={0.8}
            >
                {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
            </TouchableOpacity>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: "#8E8E93",
    },
    infoCard: {
        flexDirection: "row",
        gap: 10,
        backgroundColor: tokens.infoBg,
        borderRadius: 14,
        padding: 14,
        marginTop: 8,
        alignItems: "flex-start",
    },
    infoText: {
        fontSize: 13,
        lineHeight: 19,
        flex: 1,
    },
    languageList: {
        gap: 10,
        marginTop: 20,
    },
    languageItem: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 18,
        gap: 14,
    },
    flag: {
        fontSize: 28,
    },
    languageLabel: {
        fontSize: 17,
        flex: 1,
    },
    radioOuter: {
        width: 24,
        height: 24,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        marginTop: 24,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.45,
    },
});
