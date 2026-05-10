import { Colors, tokens } from "@/constants/theme";
import LoginRequired from "@/components/LoginRequired";
import ScreenContainer from "@/components/ScreenContainer";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { AnalyzeMediaLog, AiAnalysisType, AiUrgency } from "@/types/ai";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from "react-native";
import { useGetAnalysisLogs } from "@/query-hooks/useAnalysisLogs";

const ANALYSIS_TYPE_ICONS: Record<AiAnalysisType, keyof typeof MaterialIcons.glyphMap> = {
  [AiAnalysisType.DASHBOARD]: "dashboard",
  [AiAnalysisType.WARNING_LIGHT]: "warning",
  [AiAnalysisType.OBD_CODE]: "bluetooth-searching",
  [AiAnalysisType.GENERAL]: "search",
};

function urgencyColors(urgency: AiUrgency) {
  switch (urgency) {
    case "critical":
      return { bg: tokens.dangerBg, text: tokens.danger };
    case "warning":
      return { bg: tokens.warningBg, text: tokens.warning };
    case "info":
      return { bg: tokens.infoBg, text: Colors.primary };
  }
}

function statusColor(status: string) {
  if (status === "completed") return tokens.success;
  if (status === "failed") return tokens.danger;
  return tokens.warning;
}

function urgencyLabel(urgency: AiUrgency, t: (key: string) => string) {
  if (urgency === "critical") return t("history.urgency.critical");
  if (urgency === "warning") return t("history.urgency.warning");
  if (urgency === "info") return t("history.urgency.info");
  return urgency;
}

function statusLabel(status: string, t: (key: string) => string) {
  if (status === "completed") return t("history.status.completed");
  if (status === "failed") return t("history.status.failed");
  if (status === "pending") return t("history.status.pending");
  return status;
}

function analysisTypeIcon(
  analysisType: string
): keyof typeof MaterialIcons.glyphMap {
  return ANALYSIS_TYPE_ICONS[analysisType as AiAnalysisType] ?? "search";
}

function AnalysisCard({
  item,
  onPress,
}: {
  item: AnalyzeMediaLog;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const urgency = item.aiResponse?.urgency;
  const uColors = urgency ? urgencyColors(urgency) : null;
  const icon = analysisTypeIcon(item.analysisType);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconBadge}>
            <MaterialIcons name={icon} size={18} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.aiResponse?.title ?? item.analysisType}
          </Text>
        </View>
        {urgency && uColors && (
          <View style={[styles.urgencyBadge, { backgroundColor: uColors.bg }]}>
            <Text style={[styles.urgencyText, { color: uColors.text }]}>
              {urgencyLabel(urgency, t)}
            </Text>
          </View>
        )}
      </View>

      {item.aiResponse?.summary && (
        <Text style={styles.summary} numberOfLines={2}>
          {item.aiResponse.summary}
        </Text>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
        <View style={styles.metaRight}>
          {item.creditCost > 0 && (
            <View style={styles.creditChip}>
              <MaterialIcons name="bolt" size={12} color={tokens.warning} />
              <Text style={styles.creditText}>{item.creditCost}</Text>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={[styles.metaText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status, t)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AnalysisDetailModal({
  item,
  visible,
  onClose,
}: {
  item: AnalyzeMediaLog | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  if (!item) return null;
  const ai = item.aiResponse;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {ai?.title ?? item.analysisType}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {item.status === "failed" && item.errorMessage && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={tokens.danger} />
              <Text style={styles.errorText}>{item.errorMessage}</Text>
            </View>
          )}
          {ai ? (
            <>
              {ai.summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("history.sections.summary")}</Text>
                  <Text style={styles.sectionContent}>{ai.summary}</Text>
                </View>
              )}
              {ai.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("history.sections.description")}</Text>
                  <Text style={styles.sectionContent}>{ai.description}</Text>
                </View>
              )}
              {ai.recommendation && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("history.sections.recommendation")}</Text>
                  <Text style={styles.sectionContent}>{ai.recommendation}</Text>
                </View>
              )}
              {ai.warnings && ai.warnings.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t("history.sections.warnings")}</Text>
                  {ai.warnings.map((w, i) => (
                    <View key={i} style={styles.warningItem}>
                      <Text style={styles.warningName}>{w.name}</Text>
                      <Text style={styles.warningDesc}>{w.description}</Text>
                      {w.recommendation && (
                        <Text style={styles.warningRec}>{w.recommendation}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

type UrgencyFilter = "all" | AiUrgency;

export default function HistoryScreen() {
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const [selected, setSelected] = useState<AnalyzeMediaLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");

  const filters: { key: UrgencyFilter; label: string }[] = [
    { key: "all", label: t("history.filters.all") },
    { key: "critical", label: t("history.urgency.critical") },
    { key: "warning", label: t("history.urgency.warning") },
    { key: "info", label: t("history.urgency.info") },
  ];

  const { data, isLoading, refetch } = useGetAnalysisLogs();

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle={t("history.title")}
        title={t("history.loginRequiredTitle")}
        description={t("history.loginRequiredDescription")}
      />
    );
  }

  const logs: AnalyzeMediaLog[] = data?.results ?? [];
  const filtered: AnalyzeMediaLog[] =
    urgencyFilter === "all"
      ? logs
      : logs.filter((l) => l.aiResponse?.urgency === urgencyFilter);

  const handlePress = (item: AnalyzeMediaLog) => {
    setSelected(item);
    setModalVisible(true);
  };

  return (
    <ScreenContainer
      title={t("history.title")}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterChip,
              urgencyFilter === f.key && styles.filterChipActive,
            ]}
            onPress={() => setUrgencyFilter(f.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                urgencyFilter === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && data === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length > 0 ? (
        <View style={styles.list}>
          {filtered.map((item) => (
            <AnalysisCard key={item.id} item={item} onPress={() => handlePress(item)} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={64} color={tokens.textTertiary} />
          <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
          <Text style={styles.emptySubtitle}>
            {urgencyFilter === "all"
              ? t("history.emptyAll")
              : t("history.emptyFiltered")}
          </Text>
        </View>
      )}

      <AnalysisDetailModal
        item={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: tokens.bgSubtle,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: tokens.textSecondary,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  list: {
    gap: 12,
    paddingTop: 4,
  },
  card: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: tokens.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: tokens.textPrimary,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  summary: {
    fontSize: 13,
    color: tokens.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  creditChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: tokens.warningBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  creditText: {
    fontSize: 11,
    color: tokens.warning,
    fontWeight: "600",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: tokens.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: tokens.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.bgSurface,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderDefault,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: tokens.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: tokens.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: tokens.dangerText,
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: tokens.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 15,
    color: tokens.textPrimary,
    lineHeight: 22,
  },
  warningItem: {
    backgroundColor: tokens.warningBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  warningName: {
    fontSize: 14,
    fontWeight: "700",
    color: tokens.warningText,
  },
  warningDesc: {
    fontSize: 13,
    color: tokens.textSecondary,
    lineHeight: 18,
  },
  warningRec: {
    fontSize: 13,
    color: tokens.textTertiary,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
