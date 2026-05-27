import { tokens } from "@/constants/theme";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { BlurView } from "expo-blur";
import React, { ReactNode, useMemo } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type LiquidGlassStyle = "clear" | "regular";

interface LiquidGlassViewProps {
  readonly children?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly contentStyle?: StyleProp<ViewStyle>;
  readonly glassStyle?: LiquidGlassStyle;
  readonly tintColor?: string;
  readonly interactive?: boolean;
}

function canUseNativeGlass() {
  if (Platform.OS !== "ios") {
    return false;
  }

  try {
    return isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

export default function LiquidGlassView({
  children,
  style,
  contentStyle,
  glassStyle = "regular",
  tintColor = "rgba(255,255,255,0.34)",
  interactive = false,
}: LiquidGlassViewProps) {
  const nativeGlassAvailable = useMemo(() => canUseNativeGlass(), []);

  if (nativeGlassAvailable) {
    return (
      <GlassView
        colorScheme="light"
        glassEffectStyle={glassStyle}
        isInteractive={interactive}
        tintColor={tintColor}
        style={[styles.base, style]}
      >
        {children ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
      </GlassView>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={80}
        tint="systemChromeMaterialLight"
        style={[styles.base, style]}
      >
        <View
          pointerEvents="none"
          style={[styles.fallbackOverlay, StyleSheet.absoluteFill]}
        />
        {children ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
      </BlurView>
    );
  }

  return (
    <View style={[styles.base, styles.androidFallback, style]}>
      {children ? <View style={[styles.content, contentStyle]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  fallbackOverlay: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  androidFallback: {
    backgroundColor: tokens.glassFallback,
  },
});
