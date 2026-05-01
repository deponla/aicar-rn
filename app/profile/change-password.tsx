import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useChangePassword } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
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
        if (passed <= 1) return "#FF3B30";
        if (passed <= 2) return "#FF9500";
        if (passed <= 3) return "#F59E0B";
        if (passed <= 4) return "#34C759";
        return "#059669";
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
                                backgroundColor: i <= passed ? getColor() : "#E5E5EA",
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
                    <MaterialIcons name="person-off" size={48} color="#C7C7CC" />
                    <Text style={styles.emptyText}>Kullanıcı bilgisi bulunamadı.</Text>
                </View>
            </ScreenContainer>
        );
    }

    if (user.authProvider !== "local") {
        return (
            <ScreenContainer title="Şifre Değiştir" showBackButton>
                <View style={styles.oauthCard}>
                    <MaterialIcons name="info-outline" size={40} color="#3B82F6" />
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
            const err = error as { response?: { data?: { message?: string } } };
            notify({
                type: "error",
                title: "Şifre değiştirilemedi",
                message:
                    err?.response?.data?.message || "Lütfen daha sonra tekrar deneyin.",
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
                                placeholderTextColor="#C7C7CC"
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
                                    color="#8E8E93"
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
                                placeholderTextColor="#C7C7CC"
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
                                    color="#8E8E93"
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
                                        color={check.met ? "#34C759" : "#C7C7CC"}
                                    />
                                    <Text
                                        style={[
                                            styles.requirementText,
                                            { color: check.met ? "#059669" : "#8E8E93" },
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
                                placeholderTextColor="#C7C7CC"
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
                                    color="#8E8E93"
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
                            <ActivityIndicator color="#FFFFFF" />
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
        fontSize: 15,
        color: "#8E8E93",
    },
    oauthCard: {
        backgroundColor: "#EFF6FF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        padding: 24,
        marginTop: 24,
        alignItems: "center",
        gap: 12,
    },
    oauthTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1E40AF",
        textAlign: "center",
    },
    oauthText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#3B82F6",
        textAlign: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ECECEC",
        padding: 18,
        gap: 16,
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
    fieldGroup: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#3C3C43",
    },
    passwordRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E5EA",
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
        color: "#1C1C1E",
    },
    eyeButton: {
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    errorText: {
        fontSize: 12,
        color: "#FF3B30",
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
        fontSize: 12,
        fontWeight: "600",
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
        fontSize: 13,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
    disabledButton: {
        opacity: 0.45,
    },
});
