import ScreenContainer from "@/components/ScreenContainer";
import { useNotification } from "@/components/Notification";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function FaqItem({
    question,
    answer,
}: {
    question: string;
    answer: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const t = tokens;

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity
            style={[
                styles.faqItem,
                { backgroundColor: t.surfaceContainerLowest, borderColor: t.borderDefault },
            ]}
            onPress={toggle}
            activeOpacity={0.7}
        >
            <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: t.textPrimary }]}>
                    {question}
                </Text>
                <MaterialIcons
                    name={expanded ? "expand-less" : "expand-more"}
                    size={22}
                    color={t.textTertiary}
                />
            </View>
            {expanded && (
                <Text style={[styles.faqAnswer, { color: t.textSecondary }]}>
                    {answer}
                </Text>
            )}
        </TouchableOpacity>
    );
}

function ContactCard({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
}: {
    icon: keyof typeof MaterialIcons.glyphMap;
    iconColor: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    const t = tokens;
    return (
        <TouchableOpacity
            style={[
                styles.contactCard,
                { backgroundColor: t.surfaceContainerLowest, borderColor: t.borderDefault },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View
                style={[styles.contactIcon, { backgroundColor: iconColor + "15" }]}
            >
                <MaterialIcons name={icon} size={22} color={iconColor} />
            </View>
            <View style={styles.contactContent}>
                <Text style={[styles.contactTitle, { color: t.textPrimary }]}>
                    {title}
                </Text>
                <Text style={[styles.contactSubtitle, { color: t.textTertiary }]}>
                    {subtitle}
                </Text>
            </View>
            <MaterialIcons
                name="open-in-new"
                size={18}
                color={t.textPlaceholder}
            />
        </TouchableOpacity>
    );
}

export default function SupportScreen() {
    const t = tokens;
    const router = useRouter();
    const { notify } = useNotification();
    const { t: translate } = useTranslation();

    const faqItems = useMemo(
        () =>
            translate("supportScreen.faqItems", {
                returnObjects: true,
            }) as { question: string; answer: string }[],
        [translate],
    );

    const deviceInfo = [
        `${translate("supportScreen.deviceInfo.device")}: ${Device.modelName || translate("supportScreen.deviceInfo.unknown")}`,
        `${translate("supportScreen.deviceInfo.os")}: ${Platform.OS} ${Device.osVersion || ""}`,
        `${translate("supportScreen.deviceInfo.app")}: ${Constants.expoConfig?.version || "?"}`,
    ].join("\n");

    const openSupportEmail = useCallback(
        async ({
            subject,
            body,
            fallbackClipboardText,
            fallbackMessage,
        }: {
            subject?: string;
            body?: string;
            fallbackClipboardText: string;
            fallbackMessage: string;
        }) => {
            const queryParts = [
                subject ? `subject=${encodeURIComponent(subject)}` : undefined,
                body ? `body=${encodeURIComponent(body)}` : undefined,
            ].filter(Boolean);

            const url = `mailto:support@autolensly.com${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;

            try {
                const canOpenMail = await Linking.canOpenURL("mailto:support@autolensly.com");

                if (!canOpenMail) {
                    throw new Error("MAIL_CLIENT_UNAVAILABLE");
                }

                await Linking.openURL(url);
            } catch {
                try {
                    await Clipboard.setStringAsync(fallbackClipboardText);
                    notify({
                        type: "warning",
                        title: translate("supportScreen.mailFallbackTitle"),
                        message: fallbackMessage,
                    });
                } catch {
                    notify({
                        type: "error",
                        title: translate("supportScreen.mailFallbackTitle"),
                        message: translate("supportScreen.mailFallbackCopyFailedMessage"),
                    });
                }
            }
        },
        [notify, translate],
    );

    const handleBugReport = useCallback(async () => {
        const subject = translate("supportScreen.bugReportSubject");
        const body = `\n\n---\n${translate("supportScreen.deviceInfo.heading")}:\n${deviceInfo}`;

        await openSupportEmail({
            subject,
            body,
            fallbackClipboardText: [
                "support@autolensly.com",
                "",
                `${translate("supportScreen.subjectLabel")}: ${subject}`,
                body,
            ].join("\n"),
            fallbackMessage: translate("supportScreen.bugReportFallbackMessage"),
        });
    }, [deviceInfo, openSupportEmail, translate]);

    const handleEmailContact = useCallback(async () => {
        await openSupportEmail({
            fallbackClipboardText: "support@autolensly.com",
            fallbackMessage: translate("supportScreen.emailFallbackMessage"),
        });
    }, [openSupportEmail, translate]);

    return (
        <ScreenContainer title={translate("profileScreen.support")} showBackButton>
            {/* FAQ Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    {translate("supportScreen.sections.faq")}
                </Text>
                <View style={styles.faqList}>
                    {faqItems.map((item) => (
                        <FaqItem
                            key={item.question}
                            question={item.question}
                            answer={item.answer}
                        />
                    ))}
                </View>
            </View>

            {/* Contact Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    {translate("supportScreen.sections.contact")}
                </Text>
                <View style={styles.contactList}>
                    <ContactCard
                        icon="email"
                        iconColor="#3B82F6"
                        title={translate("supportScreen.contact.emailTitle")}
                        subtitle="support@autolensly.com"
                        onPress={handleEmailContact}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    {translate("supportScreen.sections.feedback")}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.bugReportCard,
                        { backgroundColor: t.surfaceContainerLowest, borderColor: t.borderDefault },
                    ]}
                    onPress={() => router.push("/profile/feedback")}
                    activeOpacity={0.7}
                >
                    <View style={styles.bugReportContent}>
                        <MaterialIcons name="campaign" size={28} color={Colors.primary} />
                        <View style={styles.bugReportText}>
                            <Text style={[styles.bugReportTitle, { color: t.textPrimary }]}>
                                {translate("supportScreen.feedbackCard.title")}
                            </Text>
                            <Text style={[styles.bugReportDesc, { color: t.textTertiary }]}>
                                {translate("supportScreen.feedbackCard.description")}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[styles.bugReportButton, { backgroundColor: Colors.primary }]}
                    >
                        <MaterialIcons name="arrow-forward" size={16} color={tokens.textInverse} />
                        <Text style={styles.bugReportButtonText}>
                            {translate("supportScreen.feedbackCard.button")}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Bug Report Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    {translate("supportScreen.sections.bugReport")}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.bugReportCard,
                        { backgroundColor: t.surfaceContainerLowest, borderColor: t.borderDefault },
                    ]}
                    onPress={handleBugReport}
                    activeOpacity={0.7}
                >
                    <View style={styles.bugReportContent}>
                        <MaterialIcons name="bug-report" size={28} color={Colors.secondary} />
                        <View style={styles.bugReportText}>
                            <Text style={[styles.bugReportTitle, { color: t.textPrimary }]}>
                                {translate("supportScreen.bugReportCard.title")}
                            </Text>
                            <Text style={[styles.bugReportDesc, { color: t.textTertiary }]}>
                                {translate("supportScreen.bugReportCard.description")}
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[styles.bugReportButton, { backgroundColor: Colors.primary }]}
                    >
                        <MaterialIcons name="send" size={16} color={tokens.textInverse} />
                        <Text style={styles.bugReportButtonText}>
                            {translate("supportScreen.bugReportCard.button")}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

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
    faqList: {
        gap: 8,
    },
    faqItem: {
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 8,
        ...ambientShadow,
    },
    faqHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    faqQuestion: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
        flex: 1,
        marginRight: 8,
    },
    faqAnswer: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        lineHeight: 20,
    },
    contactList: {
        gap: 10,
    },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        ...ambientShadow,
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    contactContent: {
        flex: 1,
        gap: 2,
    },
    contactTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
    },
    contactSubtitle: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
    },
    bugReportCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        gap: 14,
        ...ambientShadow,
    },
    bugReportContent: {
        flexDirection: "row",
        gap: 12,
        alignItems: "flex-start",
    },
    bugReportText: {
        flex: 1,
        gap: 4,
    },
    bugReportTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 16,
    },
    bugReportDesc: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
        lineHeight: 19,
    },
    bugReportButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 9999,
        minHeight: 44,
    },
    bugReportButtonText: {
        fontFamily: FontFamily.semiBold,
        color: tokens.textInverse,
        fontSize: 14,
    },
});
