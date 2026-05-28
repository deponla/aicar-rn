import { FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface PasswordFieldProps extends Omit<TextInputProps, "secureTextEntry"> {
    value: string;
    onChangeText: (text: string) => void;
}

export default function PasswordField({
    value,
    onChangeText,
    style,
    ...rest
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.row}>
            <TextInput
                style={[styles.input, style]}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!visible}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={tokens.textPlaceholder}
                {...rest}
            />
            <TouchableOpacity
                onPress={() => setVisible((v) => !v)}
                style={styles.eyeButton}
                activeOpacity={0.6}
            >
                <MaterialIcons
                    name={visible ? "visibility-off" : "visibility"}
                    size={22}
                    color={tokens.textTertiary}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: tokens.borderSubtle,
        backgroundColor: tokens.surfaceContainerLow,
    },
    input: {
        flex: 1,
        minHeight: 50,
        paddingHorizontal: 14,
        fontFamily: FontFamily.regular,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    eyeButton: {
        paddingHorizontal: 12,
    },
});
