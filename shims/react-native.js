const React = require("react");
const ReactNative = require("react-native");
const { getTextSizeScale, scaleTextStyle } = require("../utils/textSize");

const { StyleSheet } = ReactNative;
const NativeText = ReactNative.Text;
const NativeTextInput = ReactNative.TextInput;

function useScaledTypographyStyle(style) {
    // Lazy require to avoid circular dependency:
    // shim → usePreferences → expo-secure-store → react-native → shim
    const { usePreferencesStore } = require("../store/usePreferences");
    const textSizePreset = usePreferencesStore((state) => state.textSizePreset);
    const scale = getTextSizeScale(textSizePreset);

    return React.useMemo(() => {
        if (style == null || scale === 1) {
            return style;
        }

        return scaleTextStyle(StyleSheet.flatten(style), scale);
    }, [scale, style]);
}

const Text = React.forwardRef(function ScaledText(props, ref) {
    const scaledStyle = useScaledTypographyStyle(props.style);

    return React.createElement(NativeText, {
        ...props,
        allowFontScaling: props.allowFontScaling ?? false,
        ref,
        style: scaledStyle,
    });
});

const TextInput = React.forwardRef(function ScaledTextInput(props, ref) {
    const scaledStyle = useScaledTypographyStyle(props.style);

    return React.createElement(NativeTextInput, {
        ...props,
        allowFontScaling: props.allowFontScaling ?? false,
        ref,
        style: scaledStyle,
    });
});

Text.displayName = NativeText.displayName || "Text";
TextInput.displayName = NativeTextInput.displayName || "TextInput";
TextInput.State = NativeTextInput.State;

// Copy all property descriptors (including lazy getters like FlatList,
// VirtualizedList, etc.) — spread only copies data properties and loses them.
const shimExports = {};
Object.defineProperties(
    shimExports,
    Object.getOwnPropertyDescriptors(ReactNative),
);
shimExports.Text = Text;
shimExports.TextInput = TextInput;

module.exports = shimExports;
