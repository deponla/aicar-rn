import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Linking,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PREFS_KEY = "notification_preferences";

interface NotificationPrefs {
    messages: boolean;
    promotions: boolean;
    system: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
    messages: true,
    promotions: true,
    system: true,
};

const MASTER_CARD_ENABLED_STYLE = { borderColor: tokens.success + "40" };
const MASTER_CARD_DISABLED_STYLE = { borderColor: tokens.borderDefault };
const MASTER_ICON_ENABLED_STYLE = { backgroundColor: tokens.successBg };
const MASTER_ICON_DISABLED_STYLE = { backgroundColor: tokens.bgSubtle };
const MANAGE_BUTTON_STYLE = { borderColor: tokens.borderDefault };
const PREFERENCE_TRACK_COLOR = {
    false: tokens.borderSubtle,
    true: Colors.primary + "60",
};

function openAppSettings() {
    if (Platform.OS === "ios") {
        Linking.openURL("app-settings:");
    } else {
        Linking.openSettings();
    }
}

const PreferenceRow = memo(function PreferenceRow({
    icon,
    iconColor,
    label,
    description,
    value,
    onToggle,
    disabled,
}: {
    icon: keyof typeof MaterialIcons.glyphMap;
    iconColor: string;
    label: string;
    description: string;
    value: boolean;
    onToggle: (val: boolean) => void;
    disabled?: boolean;
}) {
    const iconCircleStyle = useMemo(
        () => [styles.prefIconCircle, { backgroundColor: iconColor + "15" }],
        [iconColor],
    );

    return (
        <View style={[styles.prefRow, styles.prefRowSurface]}>
            <View style={iconCircleStyle}>
                <MaterialIcons name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.prefContent}>
                <Text
                    style={[
                        styles.prefLabel,
                        disabled ? styles.prefLabelDisabled : styles.prefLabelEnabled,
                    ]}
                >
                    {label}
                </Text>
                <Text style={[styles.prefDesc, styles.prefDescMuted]}>{description}</Text>
            </View>
            <Switch
                value={value && !disabled}
                onValueChange={onToggle}
                disabled={disabled}
                trackColor={PREFERENCE_TRACK_COLOR}
                thumbColor={value && !disabled ? Colors.primary : tokens.textInverse}
                ios_backgroundColor={tokens.borderSubtle}
            />
        </View>
    );
});

export default function NotificationPreferencesScreen() {
    const theme = tokens;
    const { t } = useTranslation();
    const [pushEnabled, setPushEnabled] = useState(false);
    const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

    const checkPushPermission = useCallback(async () => {
        const perms = await Notifications.getPermissionsAsync() as unknown as { status: string };
        setPushEnabled(perms.status === "granted");
    }, []);

    const loadPrefs = useCallback(async () => {
        try {
            const stored = await SecureStore.getItemAsync(PREFS_KEY);
            if (stored) {
                setPrefs(JSON.parse(stored));
            }
        } catch {
            // Use defaults
        }
    }, []);

    const handleOpenAppSettings = useCallback(() => {
        openAppSettings();
    }, []);

    const persistPrefs = useCallback(async (nextPrefs: NotificationPrefs) => {
        await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(nextPrefs));
    }, []);

    const updatePref = useCallback((key: keyof NotificationPrefs, value: boolean) => {
        setPrefs((current) => {
            const nextPrefs = { ...current, [key]: value };
            void persistPrefs(nextPrefs);
            return nextPrefs;
        });
    }, [persistPrefs]);

    const toggleMessages = useCallback((value: boolean) => {
        updatePref("messages", value);
    }, [updatePref]);

    const togglePromotions = useCallback((value: boolean) => {
        updatePref("promotions", value);
    }, [updatePref]);

    const toggleSystem = useCallback((value: boolean) => {
        updatePref("system", value);
    }, [updatePref]);

    useEffect(() => {
        void checkPushPermission();
        void loadPrefs();
    }, [checkPushPermission, loadPrefs]);

    const handleTogglePush = useCallback(async () => {
        if (pushEnabled) {
            openAppSettings();
            return;
        }

        const perms = await Notifications.requestPermissionsAsync() as unknown as { status: string };
        const granted = perms.status === "granted";
        setPushEnabled(granted);
        if (!granted) {
            openAppSettings();
        }
    }, [pushEnabled]);

    return (
        <ScreenContainer title={t("settings.notificationPreferences")} showBackButton>
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
                    {t("notificationPreferencesScreen.sections.push")}
                </Text>
                <View
                    style={[
                        styles.masterCard,
                        styles.masterCardSurface,
                        pushEnabled ? MASTER_CARD_ENABLED_STYLE : MASTER_CARD_DISABLED_STYLE,
                    ]}
                >
                    <View style={styles.masterRow}>
                        <View
                            style={[
                                styles.masterIconCircle,
                                pushEnabled ? MASTER_ICON_ENABLED_STYLE : MASTER_ICON_DISABLED_STYLE,
                            ]}
                        >
                            <MaterialIcons
                                name="notifications-active"
                                size={24}
                                color={pushEnabled ? theme.success : theme.textPlaceholder}
                            />
                        </View>
                        <View style={styles.masterContent}>
                            <Text style={[styles.masterTitle, { color: theme.textPrimary }]}>
                                {t("notificationPreferencesScreen.master.title")}
                            </Text>
                            <Text style={[styles.masterDesc, { color: theme.textTertiary }]}>
                                {pushEnabled
                                    ? t("notificationPreferencesScreen.master.enabled")
                                    : t("notificationPreferencesScreen.master.disabled")}
                            </Text>
                        </View>
                    </View>
                    {!pushEnabled && (
                        <TouchableOpacity
                            style={styles.enableButton}
                            onPress={handleTogglePush}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.enableButtonText}>
                                {t("notificationPreferencesScreen.actions.enable")}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {pushEnabled && (
                        <TouchableOpacity
                            style={[styles.manageButton, MANAGE_BUTTON_STYLE]}
                            onPress={handleOpenAppSettings}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[styles.manageButtonText, { color: theme.textSecondary }]}
                            >
                                {t("notificationPreferencesScreen.actions.manageSystem")}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>
                    {t("notificationPreferencesScreen.sections.categories")}
                </Text>
                <View style={styles.prefList}>
                    <PreferenceRow
                        icon="chat-bubble"
                        iconColor="#3B82F6"
                        label={t("notificationPreferencesScreen.categories.messages.label")}
                        description={t("notificationPreferencesScreen.categories.messages.description")}
                        value={prefs.messages}
                        onToggle={toggleMessages}
                        disabled={!pushEnabled}
                    />
                    <PreferenceRow
                        icon="local-offer"
                        iconColor="#F59E0B"
                        label={t("notificationPreferencesScreen.categories.promotions.label")}
                        description={t("notificationPreferencesScreen.categories.promotions.description")}
                        value={prefs.promotions}
                        onToggle={togglePromotions}
                        disabled={!pushEnabled}
                    />
                    <PreferenceRow
                        icon="notifications"
                        iconColor="#8B5CF6"
                        label={t("notificationPreferencesScreen.categories.system.label")}
                        description={t("notificationPreferencesScreen.categories.system.description")}
                        value={prefs.system}
                        onToggle={toggleSystem}
                        disabled={!pushEnabled}
                    />
                </View>
            </View>

            {!pushEnabled && (
                <View style={styles.disabledNote}>
                    <MaterialIcons
                        name="info-outline"
                        size={16}
                        color={theme.warningText}
                    />
                    <Text style={[styles.disabledNoteText, { color: theme.warningText }]}>
                        {t("notificationPreferencesScreen.disabledNote")}
                    </Text>
                </View>
            )}

            <View style={{ height: 32 }} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: 20,
    },
    sectionLabel: {
        fontFamily: FontFamily.semiBold,
        fontSize: 12,
        letterSpacing: 0.6,
        marginBottom: 10,
        marginLeft: 4,
    },
    masterCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        gap: 14,
    },
    masterCardSurface: {
        backgroundColor: tokens.surfaceContainerLowest,
        ...ambientShadow,
    },
    masterRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    masterIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    masterContent: {
        flex: 1,
        gap: 2,
    },
    masterTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 17,
    },
    masterDesc: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
    },
    enableButton: {
        borderRadius: 9999,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        backgroundColor: Colors.primary,
    },
    enableButtonText: {
        fontFamily: FontFamily.semiBold,
        color: tokens.textInverse,
        fontSize: 15,
    },
    manageButton: {
        borderRadius: 9999,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        backgroundColor: tokens.surfaceContainerLowest,
    },
    manageButtonText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
    },
    prefList: {
        gap: 10,
    },
    prefRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 12,
    },
    prefRowSurface: {
        backgroundColor: tokens.surfaceContainerLowest,
        borderColor: tokens.borderDefault,
        ...ambientShadow,
    },
    prefIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    prefContent: {
        flex: 1,
        gap: 2,
    },
    prefLabel: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
    },
    prefLabelEnabled: {
        color: tokens.textPrimary,
    },
    prefLabelDisabled: {
        color: tokens.textPlaceholder,
    },
    prefDesc: {
        fontFamily: FontFamily.regular,
        fontSize: 12,
    },
    prefDescMuted: {
        color: tokens.textTertiary,
    },
    disabledNote: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        backgroundColor: tokens.warningBg,
        borderRadius: 16,
        padding: 12,
        marginTop: 16,
        ...ambientShadow,
    },
    disabledNoteText: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
        flex: 1,
    },
});
