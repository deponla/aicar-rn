
import { MaterialIcons } from "@expo/vector-icons";
import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationOptions {
  type?: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3500
  onPress?: () => void;
}

interface NotificationContextValue {
  notify: (opts: NotificationOptions) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue>({
  notify: () => { },
});

// ─── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: keyof typeof MaterialIcons.glyphMap; accent: string; bg: string; text: string }
> = {
  success: {
    icon: "check-circle",
    accent: tokens.success,
    bg: tokens.successBg,
    text: tokens.successText,
  },
  error: {
    icon: "error",
    accent: tokens.danger,
    bg: tokens.dangerBg,
    text: tokens.dangerText,
  },
  warning: {
    icon: "warning",
    accent: tokens.warning,
    bg: tokens.warningBg,
    text: tokens.warningText,
  },
  info: {
    icon: "info",
    accent: tokens.info,
    bg: tokens.infoBg,
    text: tokens.infoText,
  },
};

// ─── Banner Component ──────────────────────────────────────────────────────────

interface BannerState {
  visible: boolean;
  type: NotificationType;
  title: string;
  message?: string;
  onPress?: () => void;
}

function NotificationBanner({
  state,
  onDismiss,
}: {
  state: BannerState;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-120));
  const [opacity] = useState(() => new Animated.Value(0));
  const config = TYPE_CONFIG[state.type];
  const handlePress = useCallback(() => {
    state.onPress?.();
    onDismiss();
  }, [onDismiss, state]);

  React.useEffect(() => {
    if (state.visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state.visible, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents={state.visible ? "box-none" : "none"}
      style={[
        styles.bannerWrap,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[
          styles.banner,
          {
            backgroundColor: config.bg,
            borderLeftColor: config.accent,
          },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconBox,
            { backgroundColor: `${config.accent}22` },
          ]}
        >
          <MaterialIcons name={config.icon} size={20} color={config.accent} />
        </View>

        {/* Text */}
        <View style={styles.textBox}>
          <Text style={[styles.title, { color: config.text }]} numberOfLines={1}>
            {state.title}
          </Text>
          {state.message ? (
            <Text
              style={[styles.message, { color: `${config.text}CC` }]}
              numberOfLines={2}
            >
              {state.message}
            </Text>
          ) : null}
        </View>

        {/* Dismiss */}
        <MaterialIcons name="close" size={16} color={`${config.text}66`} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bannerState, setBannerState] = useState<BannerState>({
    visible: false,
    type: "info",
    title: "",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBannerState((s) => ({ ...s, visible: false }));
  }, []);

  const notify = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 3500,
      onPress,
    }: NotificationOptions) => {
      // Reset first if already visible
      if (timerRef.current) clearTimeout(timerRef.current);
      setBannerState({ visible: false, type, title, message, onPress });

      // Small delay so exit animation plays before new one enters
      requestAnimationFrame(() => {
        setBannerState({ visible: true, type, title, message, onPress });
        timerRef.current = setTimeout(dismiss, duration);
      });
    },
    [dismiss],
  );

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <NotificationBanner state={bannerState} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotification() {
  return useContext(NotificationContext);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bannerWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderLeftWidth: 3,
    ...ambientShadow,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  textBox: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  message: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
