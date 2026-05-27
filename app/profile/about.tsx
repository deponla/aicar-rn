import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import {
    OPEN_SOURCE_LICENSES_URL,
    PRIVACY_URL,
    TERMS_URL,
} from "@/utils/env";
import { postCheckAppVersion } from "@/api/post";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const appIconSource = require("../../assets/images/icon.png");

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
    const { t: translate } = useTranslation();
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
                    title: translate("about.updateAvailableTitle"),
                    message: translate("about.updateAvailableMessage", {
                        version: result.latestVersion,
                    }),
                });
                if (result.storeUrl) {
                    Linking.openURL(result.storeUrl);
                }
            } else {
                notify({
                    type: "success",
                    title: translate("about.upToDateTitle"),
                    message: translate("about.versionValue", { version: appVersion }),
                });
            }
        } catch {
            notify({
                type: "success",
                title: translate("about.upToDateTitle"),
                message: translate("about.versionValue", { version: appVersion }),
            });
        } finally {
            setIsChecking(false);
        }
    };

    const closeWebView = () => {
        setWebViewUrl(null);
    };

    const colorScheme = useColorScheme();

    const openInAppBrowser = (title: string, url: string) => {
        const sep = url.includes("?") ? "&" : "?";
        setWebViewTitle(title);
        setWebViewUrl(`${url}${sep}theme=${colorScheme === "dark" ? "dark" : "light"}`);
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
        <ScreenContainer title={translate("about.title")} showBackButton>
            {webViewModal}

            {/* App Identity */}
            <View style={styles.appHeader}>
                <View
                    style={[styles.appIconWrapper, { backgroundColor: Colors.primary }]}
                >
                    <Image source={appIconSource} style={styles.appIcon} />
                </View>
                <Text style={[styles.appName, { color: t.textPrimary }]}>AutoLensly</Text>
                <Text style={[styles.appTagline, { color: t.textTertiary }]}>
                    {translate("about.tagline")}
                </Text>
            </View>

            {/* Version Info Card */}
            <View
                style={[
                    styles.versionCard,
                    { backgroundColor: t.bgSurface, borderColor: t.borderDefault },
                ]}
            >
                <InfoRow label={translate("about.versionLabel")} value={appVersion} />
                {buildNumber && <InfoRow label={translate("about.buildLabel")} value={buildNumber} />}
                <InfoRow
                    label={translate("about.platformLabel")}
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
                    <ActivityIndicator color={tokens.textInverse} />
                ) : (
                    <>
                        <MaterialIcons name="system-update" size={20} color={tokens.textInverse} />
                        <Text style={styles.updateButtonText}>
                            {translate("about.checkUpdates")}
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
                    label={translate("about.links.terms")}
                    onPress={() => {
                        openInAppBrowser(
                            translate("about.links.terms"),
                            TERMS_URL
                        );
                    }}
                />
                <LinkRow
                    icon="privacy-tip"
                    label={translate("about.links.privacy")}
                    onPress={() => {
                        openInAppBrowser(
                            translate("about.links.privacy"),
                            PRIVACY_URL
                        );
                    }}
                />
                <LinkRow
                    icon="article"
                    label={translate("about.links.openSource")}
                    onPress={() => {
                        openInAppBrowser(
                            translate("about.links.openSource"),
                            OPEN_SOURCE_LICENSES_URL
                        );
                    }}
                />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: t.textPlaceholder }]}>
                    {translate("about.copyright", {
                        year: new Date().getFullYear(),
                    })}
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
        fontFamily: FontFamily.semiBold,
        flex: 1,
        textAlign: "center",
        fontSize: 17,
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
        ...ambientShadow,
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    appName: {
        fontFamily: FontFamily.bold,
        fontSize: 24,
        letterSpacing: -0.5,
    },
    appTagline: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
    },
    versionCard: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 18,
        paddingVertical: 8,
        gap: 0,
        ...ambientShadow,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    infoLabel: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
    },
    infoValue: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
    },
    updateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 9999,
        minHeight: 48,
        marginTop: 16,
    },
    updateButtonText: {
        fontFamily: FontFamily.semiBold,
        color: tokens.textInverse,
        fontSize: 15,
    },
    disabledButton: {
        opacity: 0.6,
    },
    linksCard: {
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 24,
        overflow: "hidden",
        ...ambientShadow,
    },
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    linkLabel: {
        fontFamily: FontFamily.medium,
        fontSize: 15,
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
        fontFamily: FontFamily.regular,
        fontSize: 12,
    },
});
