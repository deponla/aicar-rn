import { ambientShadow, FontFamily, tokens } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { memo, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const SectionLabel = memo(function SectionLabel({
  label,
}: {
  label: string;
}) {
  return (
    <Text style={[styles.sectionLabel, { color: tokens.textTertiary }]}>
      {label}
    </Text>
  );
});

export const SettingsMenuItem = memo(function SettingsMenuItem({
  title,
  subtitle,
  icon,
  onPress,
  destructive,
  showDivider = true,
}: Readonly<{
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  showDivider?: boolean;
}>) {
  return (
    <>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.6}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={destructive ? tokens.dangerText : tokens.textSecondary}
            style={styles.menuItemIcon}
          />
        )}
        <View style={styles.menuItemLeft}>
          <Text
            style={[
              styles.menuItemTitle,
              { color: destructive ? tokens.dangerText : tokens.textPrimary },
            ]}
          >
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={[styles.menuItemSubtitle, { color: tokens.textTertiary }]}>
            {subtitle}
          </Text>
        )}
        <MaterialIcons
          name="chevron-right"
          size={18}
          color={destructive ? tokens.dangerText : tokens.textPlaceholder}
        />
      </TouchableOpacity>
      {showDivider && (
        <View
          style={[
            styles.menuDivider,
            { backgroundColor: tokens.borderSubtle },
          ]}
        />
      )}
    </>
  );
});

export const MenuCard = memo(function MenuCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.menuCard,
        {
          backgroundColor: tokens.surfaceContainerLowest,
          borderColor: tokens.borderSubtle,
        },
      ]}
    >
      {children}
    </View>
  );
});

export function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalPanel} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              hitSlop={8}
            >
              <MaterialIcons
                name="close"
                size={22}
                color={tokens.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    ...ambientShadow,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemLeft: {
    flex: 1,
    minWidth: 0,
  },
  menuItemTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },
  menuItemSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    marginRight: 4,
    flexShrink: 1,
    textAlign: "right",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.borderDefault,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
});
