import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { useChangePassword } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { notifyApiError } from "@/utils/apiError";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

function PasswordStrengthBar({ password }: { password: string }) {
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
        if (passed <= 1) return "Çok zayıf";
        if (passed <= 2) return "Zayıf";
        if (passed <= 3) return "Orta";
        if (passed <= 4) return "Güçlü";
        return "Çok güçlü";
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

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!user) {
        return (
            <ScreenContainer title="Şifre Değiştir" showBackButton>
                <View style={styles.emptyState}>
                    <MaterialIcons name="person-off" size={48} color={tokens.textPlaceholder} />
                    <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
                </View>
            </ScreenContainer>
        );
    }

    if (user.authProvider !== "local") {
        return (
            <ScreenContainer title="Şifre Değiştir" showBackButton>
                <View style={styles.oauthCard}>
                    <MaterialIcons name="info-outline" size={40} color={tokens.info} />
                    <Text style={styles.oauthTitle}>Şifre değiştirme kullanılamaz</Text>
                    <Text style={styles.oauthText}>
                        Hesabınız {user.authProvider === "google" ? "Google" : user.authProvider === "apple" ? "Apple" : user.authProvider} ile
                        oluşturulduğu için şifre değiştirme özelliği kullanılamaz. Hesap
                        güvenliğinizi sağlayıcınız üzerinden yönetebilirsiniz.
                    </Text>
                </View>
            </ScreenContainer>
        );
    }

    const passwordChecks = [
        { label: "En az 8 karakter", met: newPassword.length >= 8 },
        { label: "Büyük harf (A-Z)", met: /[A-Z]/.test(newPassword) },
        { label: "Küçük harf (a-z)", met: /[a-z]/.test(newPassword) },
        { label: "Rakam (0-9)", met: /[0-9]/.test(newPassword) },
        { label: "Özel karakter (!@#$...)", met: /[^A-Za-z0-9]/.test(newPassword) },
    ];

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
                title: "Şifre değiştirildi",
                message: "Yeni şifreniz başarıyla kaydedildi.",
            });
            router.back();
        } catch (error: unknown) {
            notifyApiError({
                error,
                fallbackMessage: "Lütfen daha sonra tekrar deneyin.",
                notify,
                title: "Şifre değiştirilemedi",
            });
        }
    };

    return (
        <ScreenContainer title="Şifre Değiştir" showBackButton>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.card}>
                    <Text style={styles.title}>Şifrenizi değiştirin</Text>
                    <Text style={styles.subtitle}>
                        Güvenliğiniz için mevcut şifrenizi girerek yeni bir şifre
                        belirleyin.
                    </Text>

                    {/* Current Password */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Mevcut şifre</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={styles.passwordInput}
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                secureTextEntry={!showOld}
                                placeholder="Mevcut şifreniz"
                                placeholderTextColor={tokens.textPlaceholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                onPress={() => setShowOld(!showOld)}
                                style={styles.eyeButton}
                                activeOpacity={0.6}
                            >
                                <MaterialIcons
                                    name={showOld ? "visibility-off" : "visibility"}
                                    size={22}
                                    color={tokens.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Yeni şifre</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={styles.passwordInput}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNew}
                                placeholder="Yeni şifreniz"
                                placeholderTextColor={tokens.textPlaceholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNew(!showNew)}
                                style={styles.eyeButton}
                                activeOpacity={0.6}
                            >
                                <MaterialIcons
                                    name={showNew ? "visibility-off" : "visibility"}
                                    size={22}
                                    color={tokens.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
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
                        <Text style={styles.label}>Yeni şifre tekrar</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={styles.passwordInput}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                                placeholder="Yeni şifrenizi tekrar girin"
                                placeholderTextColor={tokens.textPlaceholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirm(!showConfirm)}
                                style={styles.eyeButton}
                                activeOpacity={0.6}
                            >
                                <MaterialIcons
                                    name={showConfirm ? "visibility-off" : "visibility"}
                                    size={22}
                                    color={tokens.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
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
                            <Text style={styles.primaryButtonText}>Şifreyi Değiştir</Text>
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
    passwordRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        borderRadius: 12,
        backgroundColor: tokens.surfaceContainerLow,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontFamily: FontFamily.regular,
        fontSize: 16,
        color: tokens.textPrimary,
    },
    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 14,
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
