import { Colors, FontFamily, ambientShadow, tokens } from "@/constants/theme";
import { PRIVACY_URL, TERMS_URL } from "@/utils/env";
import { useHamburgerDrawerStore } from "@/store/useHamburgerDrawer";
import { useAuthStore } from "@/store/useAuth";
import { useCreditsStore } from "@/store/useCredits";
import { AuthStatusEnum } from "@/types/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { Href, usePathname, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Animated,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type DrawerItemKey =
    | "scanner"
    | "garage"
    | "insights"
    | "subscription"
    | "settings"
    | "support";

type DrawerRoute =
    | "/(tabs)/index"
    | "/(tabs)/search"
    | "/(tabs)/insights"
    | "/(tabs)/profile"
    | "/credits"
    | "/profile/settings"
    | "/profile/support";

type DrawerLegalState = {
    title: string;
    url: string;
} | null;

const OPEN_DURATION = 220;
const CLOSE_DURATION = 180;

function getActiveItemKey(pathname: string): DrawerItemKey | null {
    if (pathname === "/" || pathname === "/index") {
        return "scanner";
    }

    if (pathname.startsWith("/search")) {
        return "garage";
    }

    if (pathname.startsWith("/insights")) {
        return "insights";
    }

    if (pathname === "/profile" || pathname.startsWith("/profile")) {
        return "settings";
    }

    return null;
}

const DrawerItem = memo(function DrawerItem({
    active,
    icon,
    label,
    onPress,
}: {
    active: boolean;
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.itemRow, active ? styles.itemRowActive : null]}
            onPress={onPress}
            activeOpacity={0.72}
        >
            <MaterialIcons
                name={icon}
                size={20}
                color={active ? Colors.secondary : tokens.textSecondary}
            />
            <Text style={[styles.itemLabel, active ? styles.itemLabelActive : null]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
});

export default function HamburgerDrawer() {
    const { t: translate } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isOpen = useHamburgerDrawerStore((state) => state.isOpen);
    const close = useHamburgerDrawerStore((state) => state.close);
    const authStore = useAuthStore();
    const credits = useCreditsStore((state) => state.credits);
    const [isRendered, setIsRendered] = useState(false);
    const [legalState, setLegalState] = useState<DrawerLegalState>(null);

    const panelWidth = useMemo(
        () => Math.min(Math.max(width * 0.72, 260), 320),
        [width],
    );
    const [translateX] = useState(() => new Animated.Value(-panelWidth));
    const [backdropOpacity] = useState(() => new Animated.Value(0));

    const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
    const user = authStore.user?.user;
    const activeItemKey = getActiveItemKey(pathname);

    useEffect(() => {
        if (!isRendered) {
            translateX.setValue(-panelWidth);
            backdropOpacity.setValue(0);
        }
    }, [backdropOpacity, isRendered, panelWidth, translateX]);

    useEffect(() => {
        if (isOpen) {
            if (!isRendered) {
                const frame = requestAnimationFrame(() => {
                    setIsRendered(true);
                });

                return () => {
                    cancelAnimationFrame(frame);
                };
            }

            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: OPEN_DURATION,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: OPEN_DURATION,
                    useNativeDriver: true,
                }),
            ]).start();
            return;
        }

        if (!isRendered) {
            return;
        }

        Animated.parallel([
            Animated.timing(translateX, {
                toValue: -panelWidth,
                duration: CLOSE_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: CLOSE_DURATION,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) {
                setIsRendered(false);
            }
        });
    }, [backdropOpacity, isOpen, isRendered, panelWidth, translateX]);

    const initials = useMemo(() => {
        const firstName = user?.name ?? "";
        const lastName = user?.surname ?? "";

        if (firstName || lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }

        return user?.email?.charAt(0).toUpperCase() ?? "?";
    }, [user?.email, user?.name, user?.surname]);

    const displayName = useMemo(() => {
        if (!user) {
            return translate("tabs.signIn");
        }

        if (user.name && user.surname) {
            return `${user.name} ${user.surname}`;
        }

        return user.email ?? translate("tabs.signIn");
    }, [translate, user]);

    const secondaryText = useMemo(() => {
        if (credits?.isPremium) {
            return null;
        }

        if (user?.email) {
            return user.email;
        }

        return translate("profileScreen.guestDescription");
    }, [credits?.isPremium, translate, user]);

    const handleClose = useCallback(() => {
        close();
    }, [close]);

    const handleNavigate = useCallback(
        (route: DrawerRoute) => {
            close();
            router.push(route as Href);
        },
        [close, router],
    );

    const handleOpenLegal = useCallback(
        (title: string, url: string) => {
            close();
            setLegalState({ title, url });
        },
        [close],
    );

    const handleLogout = useCallback(() => {
        close();
        Alert.alert(
            translate("profileScreen.logout"),
            translate("profileScreen.logoutConfirm"),
            [
                {
                    text: translate("profileScreen.cancel"),
                    style: "cancel",
                },
                {
                    text: translate("profileScreen.logout"),
                    style: "destructive",
                    onPress: async () => {
                        await authStore.logout();
                    },
                },
            ],
        );
    }, [authStore, close, translate]);

    const settingsRoute: DrawerRoute = isLoggedIn
        ? "/profile/settings"
        : "/(tabs)/profile";

    const items = useMemo(
        () => [
            {
                key: "scanner" as const,
                icon: "center-focus-strong" as const,
                label: translate("drawer.homeScanner"),
                onPress: () => handleNavigate("/(tabs)/index"),
            },
            {
                key: "garage" as const,
                icon: "directions-car" as const,
                label: translate("drawer.myGarage"),
                onPress: () => handleNavigate("/(tabs)/search"),
            },
            {
                key: "insights" as const,
                icon: "bar-chart" as const,
                label: translate("tabs.insights"),
                onPress: () => handleNavigate("/(tabs)/insights"),
            },
            {
                key: "subscription" as const,
                icon: "credit-card" as const,
                label: translate("drawer.subscription"),
                onPress: () => handleNavigate("/credits"),
            },
            {
                key: "settings" as const,
                icon: "settings" as const,
                label: translate("settings.title"),
                onPress: () => handleNavigate(settingsRoute),
            },
            {
                key: "support" as const,
                icon: "help-outline" as const,
                label: translate("profileScreen.support"),
                onPress: () => handleNavigate("/profile/support"),
            },
        ],
        [handleNavigate, settingsRoute, translate],
    );

    if (!isRendered && !legalState) {
        return null;
    }

    return (
        <>
            <Modal
                visible={isRendered}
                transparent
                animationType="none"
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                <View style={styles.modalRoot}>
                    <Animated.View
                        pointerEvents="none"
                        style={[styles.backdrop, { opacity: backdropOpacity }]}
                    />

                    <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

                    <Animated.View
                        style={[
                            styles.panel,
                            {
                                width: panelWidth,
                                paddingTop: insets.top + 8,
                                paddingBottom: Math.max(insets.bottom + 14, 24),
                                transform: [{ translateX }],
                            },
                        ]}
                    >
                        <View style={styles.headerBlock}>
                            {user?.photo ? (
                                <Image source={{ uri: user.photo }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Text style={styles.avatarFallbackText}>{initials}</Text>
                                </View>
                            )}

                            <Text style={styles.displayName} numberOfLines={1}>
                                {displayName}
                            </Text>

                            {credits?.isPremium ? (
                                <View style={styles.memberChip}>
                                    <MaterialIcons name="stars" size={12} color={Colors.secondary} />
                                    <Text style={styles.memberChipText}>{translate("drawer.proMember")}</Text>
                                </View>
                            ) : secondaryText ? (
                                <Text style={styles.secondaryText} numberOfLines={2}>
                                    {secondaryText}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.itemsWrap}>
                            {items.map((item) => (
                                <DrawerItem
                                    key={item.key}
                                    active={activeItemKey === item.key}
                                    icon={item.icon}
                                    label={item.label}
                                    onPress={item.onPress}
                                />
                            ))}
                        </View>

                        <View style={styles.footerWrap}>
                            {isLoggedIn ? (
                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    onPress={handleLogout}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons name="logout" size={18} color={tokens.textPrimary} />
                                    <Text style={styles.logoutButtonText}>
                                        {translate("profileScreen.logout")}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            <View style={styles.legalRow}>
                                <TouchableOpacity
                                    onPress={() =>
                                        handleOpenLegal(
                                            translate("about.links.privacy"),
                                            PRIVACY_URL,
                                        )
                                    }
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.legalLink}>{translate("about.links.privacy")}</Text>
                                </TouchableOpacity>
                                <Text style={styles.legalDot}>•</Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        handleOpenLegal(translate("about.links.terms"), TERMS_URL)
                                    }
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.legalLink}>{translate("about.links.terms")}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            <Modal
                visible={legalState !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setLegalState(null)}
            >
                <SafeAreaView style={styles.legalModalContainer} edges={["top"]}>
                    <View style={styles.legalModalHeader}>
                        <View style={styles.legalModalSpacer} />
                        <Text style={styles.legalModalTitle} numberOfLines={1}>
                            {legalState?.title}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setLegalState(null)}
                            style={styles.legalCloseButton}
                        >
                            <View style={styles.legalCloseCircle}>
                                <MaterialIcons name="close" size={16} color={tokens.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {legalState ? (
                        <WebView source={{ uri: legalState.url }} style={styles.webView} />
                    ) : null}
                </SafeAreaView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalRoot: {
        flex: 1,
        justifyContent: "flex-start",
    },
    backdrop: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(16, 24, 40, 0.24)",
    },
    panel: {
        flex: 1,
        backgroundColor: tokens.surfaceContainerLowest,
        borderTopRightRadius: 24,
        borderBottomRightRadius: 24,
        overflow: "hidden",
        ...ambientShadow,
    },
    headerBlock: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        backgroundColor: tokens.bgSubtle,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: tokens.borderSubtle,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 14,
        backgroundColor: tokens.surfaceContainerHighest,
    },
    avatarFallback: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primary,
    },
    avatarFallbackText: {
        fontFamily: FontFamily.bold,
        fontSize: 18,
        color: tokens.textInverse,
    },
    displayName: {
        fontFamily: FontFamily.bold,
        fontSize: 28,
        lineHeight: 34,
        color: tokens.textPrimary,
    },
    memberChip: {
        marginTop: 8,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: `${Colors.secondaryContainer}20`,
    },
    memberChipText: {
        fontFamily: FontFamily.medium,
        fontSize: 12,
        color: Colors.secondary,
    },
    secondaryText: {
        marginTop: 8,
        fontFamily: FontFamily.regular,
        fontSize: 13,
        lineHeight: 18,
        color: tokens.textSecondary,
    },
    itemsWrap: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 14,
    },
    itemRow: {
        minHeight: 44,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 12,
        marginBottom: 6,
    },
    itemRowActive: {
        backgroundColor: `${Colors.secondaryContainer}18`,
    },
    itemLabel: {
        fontFamily: FontFamily.medium,
        fontSize: 15,
        lineHeight: 20,
        color: tokens.textPrimary,
    },
    itemLabelActive: {
        color: Colors.primary,
    },
    footerWrap: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: tokens.borderSubtle,
    },
    logoutButton: {
        minHeight: 48,
        borderRadius: 999,
        backgroundColor: tokens.surfaceContainerLow,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    logoutButtonText: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
        color: tokens.textPrimary,
    },
    legalRow: {
        marginTop: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    legalLink: {
        fontFamily: FontFamily.regular,
        fontSize: 12,
        color: tokens.textTertiary,
    },
    legalDot: {
        fontFamily: FontFamily.regular,
        fontSize: 10,
        color: tokens.textPlaceholder,
    },
    legalModalContainer: {
        flex: 1,
        backgroundColor: tokens.bgSurface,
    },
    legalModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: tokens.borderDefault,
    },
    legalModalSpacer: {
        width: 30,
    },
    legalModalTitle: {
        flex: 1,
        textAlign: "center",
        fontFamily: FontFamily.semiBold,
        fontSize: 17,
        color: tokens.textPrimary,
    },
    legalCloseButton: {
        padding: 4,
    },
    legalCloseCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tokens.bgMuted,
    },
    webView: {
        flex: 1,
    },
});
