// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const Colors = {
  primary: "#000000",
  primaryDark: "#0d1c32",
  secondary: "#00677e",
  accent: "#ba1a1a",
  secondaryContainer: "#00d2fd",
  onSecondaryContainer: "#005669",
};

// ─── Font Family ──────────────────────────────────────────────────────────────
export const FontFamily = {
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  unit: 8,
  cardGap: 12,
  gutter: 16,
  containerPadding: 20,
  touchTargetMin: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const ambientShadow = {
  shadowColor: "#0d1c32",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 3,
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
// All hardcoded colors should come from here.

export const tokens = {
  // Material Design 3 Surface Hierarchy
  bgBase: "#fbf9fb",
  bgSurface: "#fbf9fb",
  bgElevated: "#ffffff",
  bgSubtle: "#f5f3f5",
  bgMuted: "#efedef",
  glassFallback: "rgba(251,249,251,0.82)",
  glassStroke: "rgba(255,255,255,0.56)",
  glassStrokeMuted: "rgba(197,198,205,0.34)",
  glassTint: "rgba(255,255,255,0.34)",

  // Surface Container Scale
  surfaceContainerLowest: "rgba(255,255,255,0.86)",
  surfaceContainerLow: "rgba(245,243,245,0.78)",
  surfaceContainer: "rgba(239,237,239,0.72)",
  surfaceContainerHigh: "rgba(234,231,234,0.68)",
  surfaceContainerHighest: "rgba(228,226,228,0.64)",
  surfaceVariant: "rgba(228,226,228,0.64)",

  // Text
  textPrimary: "#1b1b1d",
  textSecondary: "#44474d",
  textTertiary: "#75777e",
  textPlaceholder: "#c5c6cd",
  textInverse: "#ffffff",

  // Border / Divider
  borderDefault: "#c5c6cd",
  borderSubtle: "#e4e2e4",
  divider: "#c5c6cd",

  // Semantic
  success: "#34C759",
  successBg: "#ECFDF3",
  successText: "#059669",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  warningText: "#D97706",
  danger: "#ba1a1a",
  dangerBg: "#ffdad6",
  dangerText: "#93000a",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  infoText: "#2563EB",

  // Brand (M3 palette)
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  accent: Colors.accent,
  primaryLight: "#d6e3ff",
  secondary: Colors.secondary,
  secondaryLight: "#b4ebff",

  // M3 Color Roles
  primaryContainer: "#0d1c32",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#76849f",
  secondaryContainer: "#00d2fd",
  onSecondaryContainer: "#005669",
  tertiaryFixed: "#ffdcbd",
  onTertiaryFixedVariant: "#5d4124",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  surfaceTint: "#515f78",
  inverseSurface: "#303032",
  inverseOnSurface: "#f2f0f2",
  secondaryFixedDim: "#3cd7ff",
};
