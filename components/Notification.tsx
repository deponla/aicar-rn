
import { MaterialIcons } from "@expo/vector-icons";
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

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationOptions {
  type?: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, default 3500
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
    accent: "#34C759",
    bg: "#0D2E1A",
    text: "#ECFDF3",
  },
  error: {
    icon: "error",
    accent: "#FF453A",
    bg: "#2E0D0D",
    text: "#FEF2F2",
  },
  warning: {
    icon: "warning",
    accent: "#FFD60A",
    bg: "#2A2200",
    text: "#FFFBEB",
  },
  info: {
    icon: "info",
    accent: "#0A84FF",
    bg: "#001A3D",
    text: "#EFF6FF",
  },
};

// ─── Banner Component ──────────────────────────────────────────────────────────

interface BannerState {
  visible: boolean;
  type: NotificationType;
  title: string;
  message?: string;
}

function NotificationBanner({
  state,
  onDismiss,
}: {
  state: BannerState;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TYPE_CONFIG[state.type];

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
        onPress={onDismiss}
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
    ({ type = "info", title, message, duration = 3500 }: NotificationOptions) => {
      // Reset first if already visible
      if (timerRef.current) clearTimeout(timerRef.current);
      setBannerState({ visible: false, type, title, message });

      // Small delay so exit animation plays before new one enters
      requestAnimationFrame(() => {
        setBannerState({ visible: true, type, title, message });
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
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
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
