import { Colors, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

interface ChatComposerInputProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  isSending: boolean;
  onChangeText: (value: string) => void;
  onSend: () => void;
  editable?: boolean;
}

export default function ChatComposerInput({
  value,
  placeholder,
  disabled,
  isSending,
  onChangeText,
  onSend,
  editable = true,
}: ChatComposerInputProps) {
  return (
    <>
      <TextInput
        style={[
          styles.textInput,
          { backgroundColor: tokens.bgSubtle, color: tokens.textPrimary },
        ]}
        placeholder={placeholder}
        placeholderTextColor={tokens.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={2000}
        returnKeyType="default"
        blurOnSubmit={false}
        editable={editable}
      />
      <TouchableOpacity
        style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialIcons name="send" size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
