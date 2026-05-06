import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { useGetLegalDocuments } from "@/query-hooks/useLegal";
import { LegalDocument, LegalDocumentTypeEnum } from "@/types/legal";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ICON_MAP: Record<
  string,
  keyof typeof MaterialIcons.glyphMap
> = {
  [LegalDocumentTypeEnum.TERMS_OF_USE]: "description",
  [LegalDocumentTypeEnum.PRIVACY_POLICY]: "privacy-tip",
  [LegalDocumentTypeEnum.COOKIE_POLICY]: "cookie",
  [LegalDocumentTypeEnum.TERMS_AND_RULES]: "gavel",
  [LegalDocumentTypeEnum.ACCOUNT_AGREEMENT]: "assignment",
  [LegalDocumentTypeEnum.HELP_GUIDE]: "help-outline",
};

function LegalDocumentViewer({
  document,
  onClose,
}: {
  document: LegalDocument;
  onClose: () => void;
}) {
  const { width: _width } = useWindowDimensions();

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
              <MaterialIcons size={16} name="close" color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={{ color: tokens.textPrimary, fontSize: 15, lineHeight: 22 }}>
            {document.content.replace(/<[^>]*>/g, '')}
          </Text>
          <Text style={styles.versionText}>
            Versiyon {document.version}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function LegalScreen() {
  const { data, isLoading, refetch } = useGetLegalDocuments();
  const [selected, setSelected] = useState<LegalDocument | null>(null);

  const documents = Array.isArray(data) ? data : [];

  return (
    <ScreenContainer
      title="Yasal"
      showBackButton
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {selected && (
        <LegalDocumentViewer
          document={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {isLoading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : documents.length > 0 ? (
        <View style={styles.card}>
          {documents.map((doc, index) => (
            <View key={doc.id}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.6}
                onPress={() => setSelected(doc)}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons
                      name={ICON_MAP[doc.type] ?? "article"}
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                  <View>
                    <Text style={styles.menuItemTitle}>{doc.title}</Text>
                    {doc.excerpt && (
                      <Text style={styles.menuItemSubtitle} numberOfLines={1}>
                        {doc.excerpt}
                      </Text>
                    )}
                  </View>
                </View>
                <MaterialIcons
                  size={20}
                  name="chevron-right"
                  color="#C7C7CC"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="article" size={48} color={tokens.textTertiary} />
          <Text style={styles.emptyText}>Yasal belge bulunamadı</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  modalHeaderSpacer: {
    width: 30,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
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
    backgroundColor: "#F2F4F8",
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
  versionText: {
    fontSize: 12,
    color: tokens.textTertiary,
    marginTop: 24,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
    marginTop: 10,
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
    backgroundColor: Colors.primary + "14",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: tokens.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
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
    fontSize: 16,
    color: tokens.textSecondary,
  },
});
