import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { changeAppLanguage, normalizeLanguage } from "@/i18n";
import { usePatchUsers } from "@/query-hooks/useUser";
import { mergeAuthenticatedUser, useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const LANGUAGES = [
    { code: "tr", flag: "🇹🇷" },
    { code: "en", flag: "🇬🇧" },
    { code: "de", flag: "🇩🇪" },
] as const;

export default function LanguageScreen() {
    const { t: translate } = useTranslation();
    const authStore = useAuthStore();
    const user = authStore.user?.user;
    const { notify } = useNotification();
    const patchUser = usePatchUsers();
    const t = tokens;

    const [selectedLang, setSelectedLang] = useState(
        normalizeLanguage(user?.language),
    );
    const [isSaving, setIsSaving] = useState(false);

    if (!user) {
        return (
            <ScreenContainer title={translate("language.title")} showBackButton>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
                    <Text style={styles.emptyText}>{translate("language.noUser")}</Text>
                </View>
            </ScreenContainer>
        );
    }

    const currentLang = normalizeLanguage(user.language);
    const hasChanged = selectedLang !== currentLang;

    const handleSave = async () => {
        if (!hasChanged) return;

        try {
            setIsSaving(true);
            const nextLanguage = await changeAppLanguage(selectedLang);
            await patchUser.mutateAsync({
                id: user.id,
                d: { language: nextLanguage },
            });

            mergeAuthenticatedUser({ language: nextLanguage });

            notify({ type: "success", title: translate("language.saved") });
        } catch (error: unknown) {
            notifyApiError({
                error,
                fallbackMessage: translate("language.retryLater"),
                notify,
                title: translate("language.saveFailed"),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScreenContainer title={translate("language.title")} showBackButton>
            <View style={styles.infoCard}>
                <MaterialIcons name="translate" size={20} color={t.infoText} />
                <Text style={[styles.infoText, { color: t.infoText }]}>
                    {translate("language.description")}
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
                                        fontFamily: isSelected
                                            ? FontFamily.bold
                                            : FontFamily.medium,
                                    },
                                ]}
                            >
                                {translate(`common.languages.${lang.code}`)}
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
                    <ActivityIndicator color={tokens.textInverse} />
                ) : (
                    <Text style={styles.saveButtonText}>{translate("language.save")}</Text>
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
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textTertiary,
    },
    infoCard: {
        flexDirection: "row",
        gap: 10,
        backgroundColor: tokens.infoBg,
        borderRadius: 20,
        padding: 14,
        marginTop: 8,
        alignItems: "flex-start",
        ...ambientShadow,
    },
    infoText: {
        fontFamily: FontFamily.regular,
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
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 18,
        gap: 14,
        ...ambientShadow,
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
        borderRadius: 9999,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        marginTop: 24,
    },
    saveButtonText: {
        fontFamily: FontFamily.semiBold,
        color: tokens.textInverse,
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.45,
    },
});
