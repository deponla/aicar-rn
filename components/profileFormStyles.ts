import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const profileFormStyles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: tokens.textTertiary,
  },
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    marginBottom: 18,
    marginTop: 12,
    ...ambientShadow,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textPrimary,
    backgroundColor: tokens.surfaceContainerLow,
  },
  statusText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: tokens.textSecondary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textInverse,
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
    backgroundColor: tokens.surfaceContainerLowest,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.45,
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
    fontSize: 14,
  },
});
