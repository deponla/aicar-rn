import { useNotification } from "@/components/Notification";
import PasswordField from "@/components/PasswordField";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { useChangePassword } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

function PasswordStrengthBar({ password }: { password: string }) {
    const { t } = useTranslation();
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const passed = checks.filter(Boolean).length;

    const getColor = () => {
        if (passed <= 1) return tokens.danger;
        if (passed <= 2) return tokens.warningText;
        if (passed <= 3) return tokens.warning;
        if (passed <= 4) return tokens.success;
        return tokens.successText;
    };

    const getLabel = () => {
        if (passed <= 1) return t("changePasswordScreen.strength.veryWeak");
        if (passed <= 2) return t("changePasswordScreen.strength.weak");
        if (passed <= 3) return t("changePasswordScreen.strength.medium");
        if (passed <= 4) return t("changePasswordScreen.strength.strong");
        return t("changePasswordScreen.strength.veryStrong");
    };

    if (password.length === 0) return null;

    return (
        <View style={styles.strengthContainer}>
            <View style={styles.strengthBarTrack}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.strengthBarSegment,
                            {
                                backgroundColor: i <= passed ? getColor() : tokens.borderSubtle,
                            },
                        ]}
                    />
                ))}
            </View>
            <Text style={[styles.strengthLabel, { color: getColor() }]}>
                {getLabel()}
            </Text>
        </View>
    );
}

export default function ChangePasswordScreen() {
    const authStore = useAuthStore();
    const user = authStore.user?.user;
    const router = useRouter();
    const { notify } = useNotification();
    const changePassword = useChangePassword();
    const { t } = useTranslation();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const providerDisplayName = user?.authProvider === "google"
        ? "Google"
        : user?.authProvider === "apple"
            ? "Apple"
            : user?.authProvider;

    const passwordChecks = useMemo(
        () => [
            {
                label: t("changePasswordScreen.requirements.minLength"),
                met: newPassword.length >= 8,
            },
            {
                label: t("changePasswordScreen.requirements.uppercase"),
                met: /[A-Z]/.test(newPassword),
            },
            {
                label: t("changePasswordScreen.requirements.lowercase"),
                met: /[a-z]/.test(newPassword),
            },
            {
                label: t("changePasswordScreen.requirements.number"),
                met: /[0-9]/.test(newPassword),
            },
            {
                label: t("changePasswordScreen.requirements.special"),
                met: /[^A-Za-z0-9]/.test(newPassword),
            },
        ],
        [newPassword, t],
    );

    if (!user) {
        return (
            <ScreenContainer title={t("settings.changePassword")} showBackButton>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
                    <Text style={styles.emptyText}>{t("settings.noUser")}</Text>
                </View>
            </ScreenContainer>
        );
    }

    if (user.authProvider !== "local") {
        return (
            <ScreenContainer title={t("settings.changePassword")} showBackButton>
                <View style={styles.oauthCard}>
                    <MaterialIcons name="info-outline" size={40} color={tokens.info} />
                    <Text style={styles.oauthTitle}>{t("changePasswordScreen.oauthTitle")}</Text>
                    <Text style={styles.oauthText}>
                        {t("changePasswordScreen.oauthMessage", {
                            provider: providerDisplayName,
                        })}
                    </Text>
                </View>
            </ScreenContainer>
        );
    }

    const isNewPasswordStrong = passwordChecks.every((c) => c.met);
    const passwordsMatch = newPassword === confirmPassword;
    const isValid =
        oldPassword.length > 0 &&
        isNewPasswordStrong &&
        passwordsMatch &&
        confirmPassword.length > 0;

    const handleChangePassword = async () => {
        if (!isValid) return;

        try {
            await changePassword.mutateAsync({
                oldPassword,
                newPassword,
            });

            notify({
                type: "success",
                title: t("changePasswordScreen.successTitle"),
                message: t("changePasswordScreen.successMessage"),
            });
            router.back();
        } catch (error: unknown) {
            notifyApiError({
                error,
                fallbackMessage: t("changePasswordScreen.errorMessage"),
                notify,
                title: t("changePasswordScreen.errorTitle"),
            });
        }
    };

    return (
        <ScreenContainer title={t("settings.changePassword")} showBackButton>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t("changePasswordScreen.title")}</Text>
                    <Text style={styles.subtitle}>{t("changePasswordScreen.subtitle")}</Text>

                    {/* Current Password */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>{t("changePasswordScreen.fields.current.label")}</Text>
                        <PasswordField
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            placeholder={t("changePasswordScreen.fields.current.placeholder")}
                        />
                    </View>

                    {/* New Password */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>{t("changePasswordScreen.fields.next.label")}</Text>
                        <PasswordField
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder={t("changePasswordScreen.fields.next.placeholder")}
                        />
                        <PasswordStrengthBar password={newPassword} />
                    </View>

                    {/* Password Requirements */}
                    {newPassword.length > 0 && (
                        <View style={styles.requirementsList}>
                            {passwordChecks.map((check) => (
                                <View key={check.label} style={styles.requirementRow}>
                                    <MaterialIcons
                                        name={check.met ? "check-circle" : "radio-button-unchecked"}
                                        size={16}
                                        color={check.met ? tokens.success : tokens.textPlaceholder}
                                    />
                                    <Text
                                        style={[
                                            styles.requirementText,
                                            { color: check.met ? tokens.successText : tokens.textTertiary },
                                        ]}
                                    >
                                        {check.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Confirm Password */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>{t("changePasswordScreen.fields.confirm.label")}</Text>
                        <PasswordField
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder={t("changePasswordScreen.fields.confirm.placeholder")}
                        />
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <Text style={styles.errorText}>{t("changePasswordScreen.passwordMismatch")}</Text>
                        )}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            (!isValid || changePassword.isPending) && styles.disabledButton,
                        ]}
                        onPress={handleChangePassword}
                        disabled={!isValid || changePassword.isPending}
                        activeOpacity={0.8}
                    >
                        {changePassword.isPending ? (
                            <ActivityIndicator color={tokens.textInverse} />
                        ) : (
                            <Text style={styles.primaryButtonText}>{t("changePasswordScreen.submit")}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </KeyboardAvoidingView>
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
    oauthCard: {
        backgroundColor: tokens.infoBg,
        borderRadius: 24,
        padding: 24,
        marginTop: 24,
        alignItems: "center",
        gap: 12,
        ...ambientShadow,
    },
    oauthTitle: {
        fontFamily: FontFamily.bold,
        fontSize: 17,
        color: tokens.textPrimary,
        textAlign: "center",
    },
    oauthText: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        lineHeight: 20,
        color: tokens.textSecondary,
        textAlign: "center",
    },
    card: {
        backgroundColor: tokens.surfaceContainerLowest,
        borderRadius: 24,
        padding: 18,
        gap: 16,
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
    fieldGroup: {
        gap: 6,
    },
    label: {
        fontFamily: FontFamily.semiBold,
        fontSize: 14,
        color: tokens.textPrimary,
    },
    errorText: {
        fontFamily: FontFamily.regular,
        fontSize: 12,
        color: tokens.danger,
    },
    strengthContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    strengthBarTrack: {
        flex: 1,
        flexDirection: "row",
        gap: 3,
    },
    strengthBarSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontFamily: FontFamily.semiBold,
        fontSize: 12,
        minWidth: 70,
        textAlign: "right",
    },
    requirementsList: {
        gap: 6,
        paddingLeft: 2,
    },
    requirementRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    requirementText: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: 9999,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    primaryButtonText: {
        fontFamily: FontFamily.semiBold,
        color: tokens.textInverse,
        fontSize: 15,
    },
    disabledButton: {
        opacity: 0.45,
    },
});
