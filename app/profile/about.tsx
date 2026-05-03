import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { postCheckAppVersion } from "@/api/post";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    const t = tokens;
    return (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: t.textTertiary }]}>
                {label}
            </Text>
            <Text style={[styles.infoValue, { color: t.textPrimary }]}>
                {value}
            </Text>
        </View>
    );
}

function LinkRow({
    icon,
    label,
    onPress,
}: {
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    onPress: () => void;
}) {
    const t = tokens;
    return (
        <>
            <TouchableOpacity
                style={styles.linkRow}
                onPress={onPress}
                activeOpacity={0.6}
            >
                <MaterialIcons name={icon} size={20} color={t.textSecondary} />
                <Text style={[styles.linkLabel, { color: t.textPrimary }]}>
                    {label}
                </Text>
                <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={t.textPlaceholder}
                />
            </TouchableOpacity>
            <View
                style={[styles.linkDivider, { backgroundColor: t.borderSubtle }]}
            />
        </>
    );
}

export default function AboutScreen() {
    const t = tokens;
    const { notify } = useNotification();
    const [isChecking, setIsChecking] = useState(false);
    const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
    const [webViewTitle, setWebViewTitle] = useState("");

    const appVersion = Constants.expoConfig?.version || "1.0.0";
    const buildNumber =
        Platform.OS === "ios"
            ? Constants.expoConfig?.ios?.buildNumber
            : Constants.expoConfig?.android?.versionCode?.toString();

    const handleCheckUpdate = async () => {
        try {
            setIsChecking(true);
            const result = await postCheckAppVersion({
                platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
                currentVersion: appVersion,
            });

            if (result.updateAvailable) {
                notify({
                    type: "info",
                    title: "Güncelleme mevcut",
                    message: `Yeni sürüm: ${result.latestVersion}`,
                });
                if (result.storeUrl) {
                    Linking.openURL(result.storeUrl);
                }
            } else {
                notify({
                    type: "success",
                    title: "Uygulamanız güncel",
                    message: `Sürüm ${appVersion}`,
                });
            }
        } catch {
            notify({
                type: "success",
                title: "Uygulamanız güncel",
                message: `Sürüm ${appVersion}`,
            });
        } finally {
            setIsChecking(false);
        }
    };

    const closeWebView = () => {
        setWebViewUrl(null);
    };

    const openInAppBrowser = (title: string, url: string) => {
        setWebViewTitle(title);
        setWebViewUrl(url);
    };

    const webViewModal = (
        <Modal
            visible={webViewUrl !== null}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={closeWebView}
        >
            <SafeAreaView
                style={[styles.modalContainer, { backgroundColor: t.bgSurface }]}
                edges={["top"]}
            >
                <View
                    style={[
                        styles.modalHeader,
                        { borderBottomColor: t.borderDefault },
                    ]}
                >
                    <View style={styles.modalHeaderSpacer} />
                    <Text style={[styles.modalTitle, { color: t.textPrimary }]}>
                        {webViewTitle}
                    </Text>
                    <TouchableOpacity onPress={closeWebView} style={styles.closeButton}>
                        <View
                            style={[
                                styles.closeButtonCircle,
                                { backgroundColor: t.bgMuted },
                            ]}
                        >
                            <MaterialIcons
                                size={16}
                                name="close"
                                color={t.textSecondary}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
                {webViewUrl && <WebView source={{ uri: webViewUrl }} style={styles.webView} />}
            </SafeAreaView>
        </Modal>
    );

    return (
        <ScreenContainer title="Hakkında" showBackButton>
            {webViewModal}

            {/* App Identity */}
            <View style={styles.appHeader}>
                <View
                    style={[styles.appIconWrapper, { backgroundColor: Colors.primary }]}
                >
                    {Constants.expoConfig?.icon ? (
                        <Image
                            source={{ uri: Constants.expoConfig.icon }}
                            style={styles.appIcon}
                        />
                    ) : (
                        <MaterialIcons name="directions-car" size={40} color="#fff" />
                    )}
                </View>
                <Text style={[styles.appName, { color: t.textPrimary }]}>AiCar</Text>
                <Text style={[styles.appTagline, { color: t.textTertiary }]}>
                    Yapay Zeka ile Araç Analizi
                </Text>
            </View>

            {/* Version Info Card */}
            <View
                style={[
                    styles.versionCard,
                    { backgroundColor: t.bgSurface, borderColor: t.borderDefault },
                ]}
            >
                <InfoRow label="Sürüm" value={appVersion} />
                {buildNumber && <InfoRow label="Build" value={buildNumber} />}
                <InfoRow
                    label="Platform"
                    value={Platform.OS === "ios" ? "iOS" : "Android"}
                />
            </View>

            {/* Update Check */}
            <TouchableOpacity
                style={[
                    styles.updateButton,
                    { backgroundColor: Colors.primary },
                    isChecking && styles.disabledButton,
                ]}
                onPress={handleCheckUpdate}
                disabled={isChecking}
                activeOpacity={0.8}
            >
                {isChecking ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <MaterialIcons name="system-update" size={20} color="#fff" />
                        <Text style={styles.updateButtonText}>
                            Güncellemeleri Kontrol Et
                        </Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Links */}
            <View
                style={[
                    styles.linksCard,
                    { backgroundColor: t.bgSurface, borderColor: t.borderDefault },
                ]}
            >
                <LinkRow
                    icon="description"
                    label="Kullanım Koşulları"
                    onPress={() => {
                        openInAppBrowser("Kullanım Koşulları", "https://deponla.com/terms");
                    }}
                />
                <LinkRow
                    icon="privacy-tip"
                    label="Gizlilik Politikası"
                    onPress={() => {
                        openInAppBrowser("Gizlilik Politikası", "https://deponla.com/privacy");
                    }}
                />
                <LinkRow
                    icon="article"
                    label="Açık Kaynak Lisansları"
                    onPress={() => {
                        openInAppBrowser(
                            "Açık Kaynak Lisansları",
                            "https://deponla.com/open-source-licenses"
                        );
                    }}
                />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: t.textPlaceholder }]}>
                    © {new Date().getFullYear()} AiCar. Tüm hakları saklıdır.
                </Text>
            </View>

            <View style={{ height: 32 }} />
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    modalHeaderSpacer: {
        width: 30,
    },
    modalTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 17,
        fontWeight: "600",
    },
    closeButton: {
        padding: 4,
    },
    closeButtonCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    webView: {
        flex: 1,
    },
    appHeader: {
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 24,
        gap: 8,
    },
    appIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    appName: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    appTagline: {
        fontSize: 14,
    },
    versionCard: {
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 8,
        gap: 0,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "600",
    },
    updateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 14,
        minHeight: 48,
        marginTop: 16,
    },
    updateButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.6,
    },
    linksCard: {
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 24,
        overflow: "hidden",
    },
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    linkLabel: {
        fontSize: 15,
        fontWeight: "500",
        flex: 1,
    },
    linkDivider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 50,
    },
    footer: {
        alignItems: "center",
        paddingTop: 32,
    },
    footerText: {
        fontSize: 12,
    },
});
