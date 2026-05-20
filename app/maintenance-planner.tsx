import LoginRequired from "@/components/LoginRequired";
import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, FontFamily, ambientShadow, tokens } from "@/constants/theme";
import { normalizeLanguage } from "@/i18n";
import {
    useCreateCarReminder,
    useGetCarReminder,
    useUpdateCarReminder,
} from "@/query-hooks/useCarReminders";
import { useGetCar } from "@/query-hooks/useCars";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { CarReminderTypeEnum } from "@/types/car-reminder";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const INTERVAL_OPTIONS = [1, 3, 6, 12] as const;
const REMINDER_TYPE_OPTIONS = Object.values(CarReminderTypeEnum);

function pickRouteParam(value?: string | string[]) {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
}

function getLocaleTag(language: string) {
    switch (language) {
        case "de":
            return "de-DE";
        case "tr":
            return "tr-TR";
        default:
            return "en-US";
    }
}

function formatDate(date: string, localeTag: string) {
    return new Intl.DateTimeFormat(localeTag, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

function inferIntervalMonths(date?: string) {
    if (!date) {
        return 3;
    }

    const diffDays = Math.max(dayjs(date).diff(dayjs(), "day"), 1);
    const approxMonths = Math.max(Math.round(diffDays / 30), 1);

    return INTERVAL_OPTIONS.reduce((closest, option) => {
        return Math.abs(option - approxMonths) < Math.abs(closest - approxMonths)
            ? option
            : closest;
    }, INTERVAL_OPTIONS[0]);
}

export default function MaintenancePlannerScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { notify } = useNotification();
    const authStore = useAuthStore();
    const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
    const params = useLocalSearchParams<{
        carId?: string | string[];
        reminderId?: string | string[];
    }>();
    const carId = pickRouteParam(params.carId);
    const reminderId = pickRouteParam(params.reminderId);
    const localeTag = getLocaleTag(
        normalizeLanguage(i18n.resolvedLanguage || i18n.language),
    );

    const carQuery = useGetCar(carId ?? "", { enabled: isLoggedIn && !!carId });
    const reminderQuery = useGetCarReminder(reminderId ?? "", {
        enabled: isLoggedIn && !!reminderId,
    });
    const createReminder = useCreateCarReminder();
    const updateReminder = useUpdateCarReminder();

    const selectedCar = carQuery.data?.result ?? null;
    const selectedReminder = reminderQuery.data?.result ?? null;

    const [type, setType] = useState<CarReminderTypeEnum>(
        CarReminderTypeEnum.PERIODIC_MAINTENANCE,
    );
    const [intervalMonths, setIntervalMonths] = useState<(typeof INTERVAL_OPTIONS)[number]>(3);
    const [nextDueMileage, setNextDueMileage] = useState("");
    const [remindDaysBefore, setRemindDaysBefore] = useState("7");
    const [remindMileageBefore, setRemindMileageBefore] = useState("500");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (!selectedReminder) {
            return;
        }

        const frame = requestAnimationFrame(() => {
            setType(selectedReminder.type);
            setIntervalMonths(inferIntervalMonths(selectedReminder.nextDueAt));
            setNextDueMileage(
                selectedReminder.nextDueMileage != null
                    ? String(selectedReminder.nextDueMileage)
                    : "",
            );
            setRemindDaysBefore(
                selectedReminder.remindDaysBefore != null
                    ? String(selectedReminder.remindDaysBefore)
                    : "7",
            );
            setRemindMileageBefore(
                selectedReminder.remindMileageBefore != null
                    ? String(selectedReminder.remindMileageBefore)
                    : "500",
            );
            setNotes(selectedReminder.notes ?? "");
        });

        return () => {
            cancelAnimationFrame(frame);
        };
    }, [selectedReminder]);

    const dueDatePreview = useMemo(
        () => dayjs().add(intervalMonths, "month").toISOString(),
        [intervalMonths],
    );
    const isSaving = createReminder.isPending || updateReminder.isPending;

    const handleSave = useCallback(() => {
        if (!carId) {
            notify({
                type: "error",
                title: t("history.reminderPlanner.missingCarTitle"),
                message: t("history.reminderPlanner.missingCarMessage"),
            });
            return;
        }

        const payload = {
            carId,
            type,
            notes: notes.trim() || undefined,
            nextDueAt: dueDatePreview,
            nextDueMileage: nextDueMileage ? parseInt(nextDueMileage, 10) : undefined,
            remindDaysBefore: remindDaysBefore ? parseInt(remindDaysBefore, 10) : undefined,
            remindMileageBefore: remindMileageBefore
                ? parseInt(remindMileageBefore, 10)
                : undefined,
        };

        const handleSuccess = () => {
            notify({
                type: "success",
                title: t("history.reminderPlanner.saveSuccessTitle"),
                message: t("history.reminderPlanner.saveSuccessMessage"),
            });
            router.back();
        };

        const handleError = (error: unknown) => {
            notify({
                type: "error",
                title: t("history.reminderPlanner.saveErrorTitle"),
                message:
                    error instanceof Error
                        ? error.message
                        : t("history.reminderPlanner.saveErrorMessage"),
            });
        };

        if (selectedReminder?.id) {
            updateReminder.mutate(
                { id: selectedReminder.id, payload },
                {
                    onError: handleError,
                    onSuccess: handleSuccess,
                },
            );
            return;
        }

        createReminder.mutate(payload, {
            onError: handleError,
            onSuccess: handleSuccess,
        });
    }, [
        carId,
        createReminder,
        dueDatePreview,
        nextDueMileage,
        notes,
        notify,
        remindDaysBefore,
        remindMileageBefore,
        router,
        selectedReminder,
        t,
        type,
        updateReminder,
    ]);

    if (!isLoggedIn) {
        return (
            <LoginRequired
                pageTitle={t("history.reminderPlanner.title")}
                title={t("history.loginRequiredTitle")}
                description={t("history.loginRequiredDescription")}
            />
        );
    }

    if (!carId) {
        return (
            <ScreenContainer title={t("history.reminderPlanner.title")} showBackButton>
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>{t("history.reminderPlanner.missingCarTitle")}</Text>
                    <Text style={styles.emptyDescription}>{t("history.reminderPlanner.missingCarMessage")}</Text>
                </View>
            </ScreenContainer>
        );
    }

    return (
        <ScreenContainer title={t("history.reminderPlanner.title")} showBackButton>
            {carQuery.isLoading || reminderQuery.isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.secondary} />
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.heroCard}>
                        <Text style={styles.heroTitle}>{t("history.reminderPlanner.subtitle")}</Text>
                        {selectedCar ? (
                            <View style={styles.carBadge}>
                                <MaterialIcons name="directions-car" size={18} color={Colors.secondary} />
                                <Text style={styles.carBadgeText}>
                                    {selectedCar.brand} {selectedCar.model} ({selectedCar.year})
                                </Text>
                            </View>
                        ) : null}
                        {selectedCar?.currentMileage != null ? (
                            <Text style={styles.heroMeta}>
                                {t("history.reminderPlanner.currentMileage")}: {new Intl.NumberFormat(localeTag).format(selectedCar.currentMileage)} km
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>{t("history.reminderPlanner.typeLabel")}</Text>
                        <View style={styles.chipWrap}>
                            {REMINDER_TYPE_OPTIONS.map((option) => {
                                const selected = option === type;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.85}
                                        onPress={() => setType(option)}
                                        style={[styles.choiceChip, selected && styles.choiceChipActive]}
                                    >
                                        <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>
                                            {t(`history.dashboard.reminderTypes.${option}`)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>{t("history.reminderPlanner.intervalLabel")}</Text>
                        <View style={styles.chipWrap}>
                            {INTERVAL_OPTIONS.map((option) => {
                                const selected = option === intervalMonths;
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.85}
                                        onPress={() => setIntervalMonths(option)}
                                        style={[styles.choiceChip, selected && styles.choiceChipActive]}
                                    >
                                        <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>
                                            {t("history.reminderPlanner.intervalMonths", { count: option })}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.previewCard}>
                            <Text style={styles.previewLabel}>{t("history.reminderPlanner.previewLabel")}</Text>
                            <Text style={styles.previewValue}>{formatDate(dueDatePreview, localeTag)}</Text>
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>{t("history.reminderPlanner.nextMileageLabel")}</Text>
                        <TextInput
                            style={styles.input}
                            value={nextDueMileage}
                            onChangeText={setNextDueMileage}
                            keyboardType="numeric"
                            placeholder={t("history.reminderPlanner.nextMileagePlaceholder")}
                            placeholderTextColor={tokens.textPlaceholder}
                        />

                        <Text style={[styles.sectionLabel, styles.subsectionLabel]}>
                            {t("history.reminderPlanner.remindDaysLabel")}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={remindDaysBefore}
                            onChangeText={setRemindDaysBefore}
                            keyboardType="numeric"
                            placeholder="7"
                            placeholderTextColor={tokens.textPlaceholder}
                        />

                        <Text style={[styles.sectionLabel, styles.subsectionLabel]}>
                            {t("history.reminderPlanner.remindMileageLabel")}
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={remindMileageBefore}
                            onChangeText={setRemindMileageBefore}
                            keyboardType="numeric"
                            placeholder="500"
                            placeholderTextColor={tokens.textPlaceholder}
                        />

                        <Text style={[styles.sectionLabel, styles.subsectionLabel]}>
                            {t("history.reminderPlanner.notesLabel")}
                        </Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            textAlignVertical="top"
                            placeholder={t("history.reminderPlanner.notesPlaceholder")}
                            placeholderTextColor={tokens.textPlaceholder}
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleSave}
                        disabled={isSaving}
                        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={tokens.textInverse} />
                        ) : (
                            <>
                                <MaterialIcons name="check-circle" size={20} color={tokens.textInverse} />
                                <Text style={styles.saveButtonText}>{t("history.reminderPlanner.save")}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 96,
    },
    content: {
        gap: 18,
        paddingTop: 12,
        paddingBottom: 36,
    },
    heroCard: {
        gap: 12,
        padding: 22,
        borderRadius: 24,
        backgroundColor: tokens.surfaceContainerLowest,
        ...ambientShadow,
    },
    heroTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 22,
        lineHeight: 30,
        color: tokens.textPrimary,
    },
    heroMeta: {
        fontFamily: FontFamily.medium,
        fontSize: 14,
        color: tokens.textSecondary,
    },
    carBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
        borderRadius: 9999,
        backgroundColor: tokens.infoBg,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    carBadgeText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
        color: Colors.secondary,
    },
    sectionCard: {
        gap: 12,
        padding: 20,
        borderRadius: 24,
        backgroundColor: tokens.surfaceContainerLowest,
        ...ambientShadow,
    },
    sectionLabel: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    subsectionLabel: {
        marginTop: 4,
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    choiceChip: {
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.bgSubtle,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    choiceChipActive: {
        backgroundColor: Colors.secondary,
        borderColor: Colors.secondary,
    },
    choiceChipText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
        color: tokens.textSecondary,
    },
    choiceChipTextActive: {
        color: tokens.textInverse,
    },
    previewCard: {
        borderRadius: 18,
        backgroundColor: tokens.infoBg,
        padding: 16,
        gap: 4,
    },
    previewLabel: {
        fontFamily: FontFamily.medium,
        fontSize: 13,
        color: Colors.secondary,
    },
    previewValue: {
        fontFamily: FontFamily.bold,
        fontSize: 17,
        color: tokens.textPrimary,
    },
    input: {
        minHeight: 50,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.bgSubtle,
        paddingHorizontal: 14,
        fontFamily: FontFamily.medium,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    multilineInput: {
        minHeight: 110,
        paddingTop: 14,
        paddingBottom: 14,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderRadius: 9999,
        backgroundColor: Colors.primaryDark,
        paddingVertical: 18,
        ...ambientShadow,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontFamily: FontFamily.bold,
        fontSize: 17,
        color: tokens.textInverse,
    },
    emptyCard: {
        marginTop: 12,
        gap: 10,
        borderRadius: 24,
        backgroundColor: tokens.surfaceContainerLowest,
        padding: 22,
        ...ambientShadow,
    },
    emptyTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 20,
        color: tokens.textPrimary,
    },
    emptyDescription: {
        fontFamily: FontFamily.regular,
        fontSize: 15,
        lineHeight: 22,
        color: tokens.textSecondary,
    },
});
