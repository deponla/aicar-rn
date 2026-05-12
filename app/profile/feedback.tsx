import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useCreateFeedback } from "@/query-hooks/useFeedback";
import { FeedbackType } from "@/types/feedback";
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
            const err = error as { response?: { data?: { message?: string } } };
            notify({
                type: "error",
                title: t("feedbackScreen.submitErrorTitle"),
                message:
                    err?.response?.data?.message ||
                    t("feedbackScreen.submitErrorMessage"),
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
                                            color={isSelected ? "#FFFFFF" : Colors.primary}
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
                        placeholderTextColor="#C7C7CC"
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
                        placeholderTextColor="#C7C7CC"
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
                            <ActivityIndicator color="#FFFFFF" />
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
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ECECEC",
        padding: 18,
        gap: 12,
        marginTop: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: "#6B7280",
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D6DCE8",
        backgroundColor: "#F8FAFF",
    },
    historyButtonText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.primary,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 14,
        backgroundColor: "#FAFAFA",
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: "#EEF4FF",
    },
    optionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E0ECFF",
    },
    optionIconWrapSelected: {
        backgroundColor: Colors.primary,
    },
    optionContent: {
        flex: 1,
        gap: 2,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    optionText: {
        fontSize: 13,
        lineHeight: 18,
        color: "#6B7280",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#3C3C43",
    },
    input: {
        minHeight: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FAFAFA",
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#1C1C1E",
    },
    messageInput: {
        minHeight: 140,
        paddingTop: 14,
        paddingBottom: 14,
    },
    helperText: {
        fontSize: 12,
        color: "#8E8E93",
    },
    messageFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    counterText: {
        fontSize: 12,
        color: "#8E8E93",
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },
    disabledButton: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
});
