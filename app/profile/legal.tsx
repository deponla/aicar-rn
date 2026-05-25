import { LegendList } from "@legendapp/list";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { useGetLegalDocuments } from "@/query-hooks/useLegal";
import { LegalDocument, LegalDocumentTypeEnum } from "@/types/legal";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  [LegalDocumentTypeEnum.TERMS_OF_USE]: "description",
  [LegalDocumentTypeEnum.PRIVACY_POLICY]: "privacy-tip",
  [LegalDocumentTypeEnum.KVKK_DISCLOSURE]: "verified-user",
  [LegalDocumentTypeEnum.COOKIE_POLICY]: "cookie",
  [LegalDocumentTypeEnum.TERMS_AND_RULES]: "gavel",
  [LegalDocumentTypeEnum.ACCOUNT_AGREEMENT]: "assignment",
  [LegalDocumentTypeEnum.HELP_GUIDE]: "help-outline",
};

const LegalDocumentViewer = React.memo(function LegalDocumentViewer({
  document,
  onClose,
}: {
  document: LegalDocument;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={["top"]}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderSpacer} />
          <Text style={styles.modalTitle} numberOfLines={1}>
            {document.title}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <View style={styles.closeButtonCircle}>
              <MaterialIcons size={16} name="close" color={tokens.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>
        <LegendList
          data={[document]}
          renderItem={({ item }) => (
            <>
              <Text style={styles.documentText}>
                {item.content.replace(/<[^>]*>/g, "")}
              </Text>
              <Text style={styles.versionText}>
                {t("legal.version", { version: item.version })}
              </Text>
            </>
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={600}
          initialContainerPoolRatio={4}
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
        />
      </SafeAreaView>
    </Modal>
  );
});

const LegalDocumentRow = React.memo(function LegalDocumentRow({
  item,
  onPress,
}: {
  item: LegalDocument;
  onPress: (document: LegalDocument) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.6}
      onPress={() => onPress(item)}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconCircle}>
          <MaterialIcons
            name={ICON_MAP[item.type] ?? "article"}
            size={20}
            color={Colors.primary}
          />
        </View>
        <View>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
          {item.excerpt ? (
            <Text style={styles.menuItemSubtitle} numberOfLines={1}>
              {item.excerpt}
            </Text>
          ) : null}
        </View>
      </View>
      <MaterialIcons size={20} name="chevron-right" color={tokens.textPlaceholder} />
    </TouchableOpacity>
  );
});

function Divider() {
  return <View style={styles.divider} />;
}

export default function LegalScreen() {
  const { t } = useTranslation();
  const { data, isLoading, refetch } = useGetLegalDocuments();
  const [selected, setSelected] = useState<LegalDocument | null>(null);

  const documents = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const keyExtractor = useCallback((item: LegalDocument) => item.id, []);
  const handlePress = useCallback((document: LegalDocument) => {
    setSelected(document);
  }, []);
  const renderItem = useCallback(
    ({ item }: { item: LegalDocument }) => (
      <LegalDocumentRow item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  return (
    <ScreenContainer
      title={t("legal.title")}
      showBackButton
      scrollable={false}
      contentContainerStyle={styles.screenContent}
    >
      {selected ? (
        <LegalDocumentViewer document={selected} onClose={() => setSelected(null)} />
      ) : null}

      {isLoading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : documents.length > 0 ? (
        <LegendList
          data={documents}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          initialContainerPoolRatio={4}
          recycleItems
          refreshing={isLoading}
          onRefresh={refetch}
          style={styles.listView}
          contentContainerStyle={styles.card}
          ItemSeparatorComponent={Divider}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="article" size={48} color={tokens.textTertiary} />
          <Text style={styles.emptyText}>{t("legal.empty")}</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  listView: {
    flex: 1,
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.borderSubtle,
  },
  modalHeaderSpacer: {
    width: 30,
  },
  modalTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: tokens.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tokens.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  documentText: {
    fontFamily: FontFamily.regular,
    color: tokens.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  versionText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: tokens.textTertiary,
    marginTop: 24,
    textAlign: "center",
  },
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.borderSubtle,
    paddingBottom: 4,
    ...ambientShadow,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}14`,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: tokens.textPrimary,
  },
  menuItemSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: tokens.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: tokens.borderSubtle,
    marginLeft: 50,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textSecondary,
  },
});
