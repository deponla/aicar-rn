import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
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

const FAQ_ITEMS = [
    {
        question: "Araç analizi nasıl çalışır?",
        answer:
            "Aracınızın fotoğraflarını çekip yükleyin, yapay zeka sistemi otomatik olarak araç detaylarını analiz edecek ve sonuçları size sunacaktır.",
    },
    {
        question: "Kredi nasıl satın alırım?",
        answer:
            "Profil sayfanızdan kredi paketleri bölümüne giderek uygun paketi seçip satın alabilirsiniz. Satın alınan krediler hesabınıza anında yüklenir.",
    },
    {
        question: "Analiz sonuçları ne kadar güvenilir?",
        answer:
            "Yapay zeka analiz sonuçları referans amaçlı sunulmaktadır. Profesyonel bir değerlendirme yerine geçmez, ancak hızlı bir genel bakış sağlar.",
    },
    {
        question: "Hesabımı nasıl silebilirim?",
        answer:
            "Profil > Hesap Ayarları > Hesap İptali bölümünden hesabınızı kapatabilirsiniz. Bu işlem geri alınamaz.",
    },
    {
        question: "Verilerim güvende mi?",
        answer:
            "Evet, tüm verileriniz şifreli olarak saklanır. Gizlilik politikamızı Profil sayfasındaki Gizlilik Politikası bölümünden okuyabilirsiniz.",
    },
];

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

    const deviceInfo = [
        `Cihaz: ${Device.modelName || "Bilinmiyor"}`,
        `OS: ${Platform.OS} ${Device.osVersion || ""}`,
        `Uygulama: ${Constants.expoConfig?.version || "?"}`,
    ].join("\n");

    const handleBugReport = () => {
        const subject = encodeURIComponent("AiCar - Hata Bildirimi");
        const body = encodeURIComponent(
            `\n\n---\nCihaz Bilgileri:\n${deviceInfo}`,
        );
        Linking.openURL(`mailto:support@aicar.com?subject=${subject}&body=${body}`);
    };

    const handleEmailContact = () => {
        Linking.openURL("mailto:support@aicar.com");
    };

    return (
        <ScreenContainer title="Yardım & Destek" showBackButton>
            {/* FAQ Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    SIK SORULAN SORULAR
                </Text>
                <View style={styles.faqList}>
                    {FAQ_ITEMS.map((item) => (
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
                    İLETİŞİM
                </Text>
                <View style={styles.contactList}>
                    <ContactCard
                        icon="email"
                        iconColor="#3B82F6"
                        title="E-posta ile İletişim"
                        subtitle="support@aicar.com"
                        onPress={handleEmailContact}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    ŞİKAYET VE ÖNERİ
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
                                Şikayet veya öneri gönder
                            </Text>
                            <Text style={[styles.bugReportDesc, { color: t.textTertiary }]}>
                                Deneyiminizi geliştirmemize yardımcı olacak görüşlerinizi
                                doğrudan uygulama içinden iletin.
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[styles.bugReportButton, { backgroundColor: Colors.primary }]}
                    >
                        <MaterialIcons name="arrow-forward" size={16} color={tokens.textInverse} />
                        <Text style={styles.bugReportButtonText}>Forma Git</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Bug Report Section */}
            <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                    HATA BİLDİRİMİ
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
                                Hata Bildir
                            </Text>
                            <Text style={[styles.bugReportDesc, { color: t.textTertiary }]}>
                                Bir sorunla karşılaştıysanız bize bildirin. Cihaz bilgileri
                                otomatik olarak eklenir.
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[styles.bugReportButton, { backgroundColor: Colors.primary }]}
                    >
                        <MaterialIcons name="send" size={16} color={tokens.textInverse} />
                        <Text style={styles.bugReportButtonText}>E-posta Gönder</Text>
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
