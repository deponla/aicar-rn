import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useReactivateAccount } from "@/query-hooks/useUser";
import { SECURE_STORE_KEY, useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
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

export default function ReactivateAccountScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams<{ email?: string; reason?: string }>();
    const router = useRouter();
    const authStore = useAuthStore();
    const { notify } = useNotification();
    const reactivateAccount = useReactivateAccount();
    const [email, setEmail] = useState(
        typeof params.email === "string" ? params.email : "",
    );
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const isFrozenLoginRecovery = params.reason === "ACCOUNT_FROZEN";

    const isValid = useMemo(() => {
        return email.trim().includes("@") && password.trim().length > 0;
    }, [email, password]);

    const handleReactivate = async () => {
        if (!isValid) {
            return;
        }

        try {
            const session = await reactivateAccount.mutateAsync({
                email: email.trim(),
                password,
            });

            await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(session));
            authStore.login(session);

            notify({
                type: "success",
                title: t("reactivateAccount.successTitle"),
                message: t("reactivateAccount.successMessage"),
            });
            router.replace("/(tabs)/profile");
        } catch (error: unknown) {
            notify({
                type: "error",
                title: t("reactivateAccount.errorTitle"),
                message:
                    error instanceof Error
                        ? error.message
                        : t("reactivateAccount.errorMessage"),
            });
        }
    };

    return (
        <ScreenContainer title={t("reactivateAccount.title")} showBackButton>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.heroCard}>
                    <View style={styles.heroIconWrap}>
                        <MaterialIcons name="lock-reset" size={32} color={Colors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>{t("reactivateAccount.heroTitle")}</Text>
                    <Text style={styles.heroText}>
                        {isFrozenLoginRecovery
                            ? t("reactivateAccount.frozenDescription")
                            : t("reactivateAccount.description")}
                    </Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>{t("reactivateAccount.emailLabel")}</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        placeholder={t("reactivateAccount.emailPlaceholder")}
                        placeholderTextColor="#C7C7CC"
                    />

                    <Text style={styles.label}>{t("reactivateAccount.passwordLabel")}</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={styles.passwordInput}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder={t("reactivateAccount.passwordPlaceholder")}
                            placeholderTextColor="#C7C7CC"
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((current) => !current)}
                            style={styles.eyeButton}
                            activeOpacity={0.6}
                        >
                            <MaterialIcons
                                name={showPassword ? "visibility-off" : "visibility"}
                                size={22}
                                color="#8E8E93"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            (!isValid || reactivateAccount.isPending) && styles.disabledButton,
                        ]}
                        onPress={handleReactivate}
                        disabled={!isValid || reactivateAccount.isPending}
                        activeOpacity={0.8}
                    >
                        {reactivateAccount.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>{t("reactivateAccount.button")}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    heroCard: {
        backgroundColor: "#EFF6FF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#BFDBFE",
        padding: 20,
        gap: 10,
        marginTop: 12,
        marginBottom: 18,
    },
    heroIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1E3A8A",
    },
    heroText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#1D4ED8",
    },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ECECEC",
        padding: 18,
        gap: 12,
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
    passwordRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FAFAFA",
    },
    passwordInput: {
        flex: 1,
        minHeight: 50,
        paddingHorizontal: 14,
        fontSize: 15,
        color: "#1C1C1E",
    },
    eyeButton: {
        paddingHorizontal: 12,
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
