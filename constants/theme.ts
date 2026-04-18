import { Platform } from "react-native";

export const Colors = {
  primary: "#1a1a2e",
  secondary: "#e94560",
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Design Tokens ────────────────────────────────────────────────────────────
// All hardcoded colors should come from here.

export const tokens = {
  // Backgrounds
  bgBase: "#F2F4F8", // Page background
  bgSurface: "#FFFFFF", // Cards, sheets
  bgElevated: "#FFFFFF", // Modals, popovers
  bgSubtle: "#F2F4F8", // Input fields, read-only rows
  bgMuted: "#E8EAF0", // Skeleton, dividers

  // Text
  textPrimary: "#1C1C1E",
  textSecondary: "#6B6B6B",
  textTertiary: "#8E8E93",
  textPlaceholder: "#C7C7CC",
  textInverse: "#FFFFFF",

  // Border / Divider
  borderDefault: "#E5E5EA",
  borderSubtle: "#F0F0F5",
  divider: "#E5E5EA",

  // Semantic
  success: "#34C759",
  successBg: "#ECFDF3",
  successText: "#059669",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  warningText: "#D97706",
  danger: "#EF4444",
  dangerBg: "#FEF2F2",
  dangerText: "#DC2626",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  infoText: "#2563EB",

  // Brand
  primary: Colors.primary,
  primaryLight: "#E8EEF9",
  secondary: Colors.secondary,
  secondaryLight: "#E6F8FC",
};
