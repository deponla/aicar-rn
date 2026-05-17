import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { useCreateFeedback } from "@/query-hooks/useFeedback";
import { FeedbackType } from "@/types/feedback";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

type FeedbackOption = {
    value: FeedbackType;
    title: string;
    description: string;
    icon: keyof typeof MaterialIcons.glyphMap;
};

export default function FeedbackScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { notify } = useNotification();
    const createFeedback = useCreateFeedback();
    const [type, setType] = useState<FeedbackType>(FeedbackType.COMPLAINT);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const feedbackOptions = useMemo<FeedbackOption[]>(
        () => [
            {
                value: FeedbackType.COMPLAINT,
                title: t("feedbackScreen.types.complaint.title"),
                description: t("feedbackScreen.types.complaint.description"),
                icon: "report-problem",
            },
            {
                value: FeedbackType.SUGGESTION,
                title: t("feedbackScreen.types.suggestion.title"),
                description: t("feedbackScreen.types.suggestion.description"),
                icon: "lightbulb-outline",
            },
        ],
        [t],
    );

    const isValid = useMemo(() => {
        return subject.trim().length >= 4 && message.trim().length >= 10;
    }, [message, subject]);

    const handleSubmit = async () => {
        if (!isValid) {
            return;
        }

        try {
            await createFeedback.mutateAsync({
                type,
                subject: subject.trim(),
                message: message.trim(),
            });

            notify({
                type: "success",
                title:
                    type === FeedbackType.COMPLAINT
                        ? t("feedbackScreen.successComplaintTitle")
                        : t("feedbackScreen.successSuggestionTitle"),
                message: t("feedbackScreen.successMessage"),
            });
            router.replace("/profile/feedback-history");
        } catch (error: unknown) {
            notifyApiError({
                error,
                fallbackMessage: t("feedbackScreen.submitErrorMessage"),
                notify,
                title: t("feedbackScreen.submitErrorTitle"),
            });
        }
    };

    return (
        <ScreenContainer title={t("feedbackScreen.title")} showBackButton>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t("feedbackScreen.heading")}</Text>
                    <Text style={styles.subtitle}>
                        {t("feedbackScreen.description")}
                    </Text>

                    <View style={styles.optionList}>
                        <TouchableOpacity
                            style={styles.historyButton}
                            onPress={() => router.push("/profile/feedback-history")}
                            activeOpacity={0.85}
                        >
                            <MaterialIcons name="history" size={16} color={Colors.primary} />
                            <Text style={styles.historyButtonText}>
                                {t("feedbackScreen.historyButton")}
                            </Text>
                        </TouchableOpacity>

                        {feedbackOptions.map((option) => {
                            const isSelected = option.value === type;

                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => setType(option.value)}
                                    activeOpacity={0.85}
                                >
                                    <View
                                        style={[
                                            styles.optionIconWrap,
                                            isSelected && styles.optionIconWrapSelected,
                                        ]}
                                    >
                                        <MaterialIcons
                                            name={option.icon}
                                            size={20}
                                            color={isSelected ? tokens.textInverse : Colors.primary}
                                        />
                                    </View>
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionTitle}>{option.title}</Text>
                                        <Text style={styles.optionText}>{option.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>{t("feedbackScreen.subjectLabel")}</Text>
                    <TextInput
                        style={styles.input}
                        value={subject}
                        onChangeText={setSubject}
                        placeholder={t("feedbackScreen.subjectPlaceholder")}
                        placeholderTextColor={tokens.textPlaceholder}
                        maxLength={160}
                    />
                    <Text style={styles.helperText}>
                        {t("feedbackScreen.subjectHelper")}
                    </Text>

                    <Text style={styles.label}>{t("feedbackScreen.messageLabel")}</Text>
                    <TextInput
                        style={[styles.input, styles.messageInput]}
                        value={message}
                        onChangeText={setMessage}
                        placeholder={t("feedbackScreen.messagePlaceholder")}
                        placeholderTextColor={tokens.textPlaceholder}
                        multiline
                        textAlignVertical="top"
                        maxLength={4000}
                    />
                    <View style={styles.messageFooter}>
                        <Text style={styles.helperText}>
                            {t("feedbackScreen.messageHelper")}
                        </Text>
                        <Text style={styles.counterText}>{message.length}/4000</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            (!isValid || createFeedback.isPending) && styles.disabledButton,
                        ]}
                        onPress={handleSubmit}
                        disabled={!isValid || createFeedback.isPending}
                        activeOpacity={0.8}
                    >
                        {createFeedback.isPending ? (
                            <ActivityIndicator color={tokens.textInverse} />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {t("feedbackScreen.submit")}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: tokens.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        gap: 12,
        marginTop: 12,
        ...ambientShadow,
    },
    title: {
        fontFamily: FontFamily.bold,
        fontSize: 18,
        color: tokens.textPrimary,
    },
    subtitle: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        lineHeight: 20,
        color: tokens.textSecondary,
    },
    optionList: {
        gap: 10,
    },
    historyButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
    },
    historyButtonText: {
        fontFamily: FontFamily.bold,
        fontSize: 13,
        color: Colors.primary,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        padding: 14,
        backgroundColor: tokens.surfaceContainerLow,
    },
    optionCardSelected: {
        borderColor: Colors.secondaryContainer,
        backgroundColor: `${Colors.secondaryContainer}18`,
    },
    optionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: tokens.surfaceContainer,
    },
    optionIconWrapSelected: {
        backgroundColor: Colors.primary,
    },
    optionContent: {
        flex: 1,
        gap: 2,
    },
    optionTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    optionText: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
        lineHeight: 18,
        color: tokens.textSecondary,
    },
    label: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
        color: tokens.textPrimary,
    },
    input: {
        minHeight: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
        paddingHorizontal: 14,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    messageInput: {
        minHeight: 140,
        paddingTop: 14,
        paddingBottom: 14,
    },
    helperText: {
        fontFamily: FontFamily.regular,
        fontSize: 12,
        color: tokens.textTertiary,
    },
    messageFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    counterText: {
        fontFamily: FontFamily.medium,
        fontSize: 12,
        color: tokens.textTertiary,
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: 9999,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },
    disabledButton: {
        opacity: 0.5,
    },
    primaryButtonText: {
        fontFamily: FontFamily.bold,
        color: tokens.textInverse,
        fontSize: 15,
    },
});
