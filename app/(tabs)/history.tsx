import { LegendList } from "@legendapp/list";
import { Colors, tokens } from "@/constants/theme";
import LoginRequired from "@/components/LoginRequired";
import ScreenContainer from "@/components/ScreenContainer";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import { AnalyzeMediaLog, AiAnalysisType, AiUrgency } from "@/types/ai";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const AnalysisCard = React.memo(function AnalysisCard({
  item,
  onPress,
}: {
  item: AnalyzeMediaLog;
  onPress: (item: AnalyzeMediaLog) => void;
}) {
  const { t } = useTranslation();
  const urgency = item.aiResponse?.urgency;
  const uColors = urgency ? urgencyColors(urgency) : null;
  const icon = analysisTypeIcon(item.analysisType);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconBadge}>
            <MaterialIcons name={icon} size={18} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.aiResponse?.title ?? item.analysisType}
          </Text>
        </View>
        {urgency && uColors ? (
          <View style={[styles.urgencyBadge, { backgroundColor: uColors.bg }]}>
            <Text style={[styles.urgencyText, { color: uColors.text }]}>
              {urgencyLabel(urgency, t)}
            </Text>
          </View>
        ) : null}
      </View>

      {item.aiResponse?.summary ? (
        <Text style={styles.summary} numberOfLines={2}>
          {item.aiResponse.summary}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
        <View style={styles.metaRight}>
          {item.creditCost > 0 ? (
            <View style={styles.creditChip}>
              <MaterialIcons name="bolt" size={12} color={tokens.warning} />
              <Text style={styles.creditText}>{item.creditCost}</Text>
            </View>
          ) : null}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor(item.status) },
            ]}
          />
          <Text style={[styles.metaText, { color: statusColor(item.status) }]}>
            {statusLabel(item.status, t)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

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
          {item.status === "failed" && item.errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={tokens.danger} />
              <Text style={styles.errorText}>{item.errorMessage}</Text>
            </View>
          ) : null}
          {ai ? (
            <>
              {ai.summary ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t("history.sections.summary")}
                  </Text>
                  <Text style={styles.sectionContent}>{ai.summary}</Text>
                </View>
              ) : null}
              {ai.description ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t("history.sections.description")}
                  </Text>
                  <Text style={styles.sectionContent}>{ai.description}</Text>
                </View>
              ) : null}
              {ai.recommendation ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t("history.sections.recommendation")}
                  </Text>
                  <Text style={styles.sectionContent}>{ai.recommendation}</Text>
                </View>
              ) : null}
              {ai.warnings && ai.warnings.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {t("history.sections.warnings")}
                  </Text>
                  {ai.warnings.map((warning, index) => (
                    <View key={`${warning.name}-${index}`} style={styles.warningItem}>
                      <Text style={styles.warningName}>{warning.name}</Text>
                      <Text style={styles.warningDesc}>{warning.description}</Text>
                      {warning.recommendation ? (
                        <Text style={styles.warningRec}>{warning.recommendation}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
          <View style={styles.modalFooterSpacing} />
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
  const { data, isLoading, refetch } = useGetAnalysisLogs();

  const filters = useMemo(
    () => [
      { key: "all" as const, label: t("history.filters.all") },
      { key: "critical" as const, label: t("history.urgency.critical") },
      { key: "warning" as const, label: t("history.urgency.warning") },
      { key: "info" as const, label: t("history.urgency.info") },
    ],
    [t],
  );

  const logs = useMemo(() => data?.results ?? [], [data?.results]);
  const filtered = useMemo(
    () =>
      urgencyFilter === "all"
        ? logs
        : logs.filter((log) => log.aiResponse?.urgency === urgencyFilter),
    [logs, urgencyFilter],
  );

  const handlePress = useCallback((item: AnalyzeMediaLog) => {
    setSelected(item);
    setModalVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AnalyzeMediaLog }) => (
      <AnalysisCard item={item} onPress={handlePress} />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: AnalyzeMediaLog) => item.id, []);

  const listHeader = useMemo(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              urgencyFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setUrgencyFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                urgencyFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    ),
    [filters, urgencyFilter],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="history" size={64} color={tokens.textTertiary} />
        <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
        <Text style={styles.emptySubtitle}>
          {urgencyFilter === "all"
            ? t("history.emptyAll")
            : t("history.emptyFiltered")}
        </Text>
      </View>
    ),
    [t, urgencyFilter],
  );

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle={t("history.title")}
        title={t("history.loginRequiredTitle")}
        description={t("history.loginRequiredDescription")}
      />
    );
  }

  return (
    <ScreenContainer
      title={t("history.title")}
      scrollable={false}
      contentContainerStyle={styles.screenContent}
    >
      {isLoading && data === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <LegendList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={120}
          recycleItems
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          style={styles.listView}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyState}
          ItemSeparatorComponent={ListSeparator}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AnalysisDetailModal
        item={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ScreenContainer>
  );
}

function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
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
  listView: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  listSeparator: {
    height: 12,
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
    fontWeight: "700",
    color: tokens.warningText,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
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
  modalContainer: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.borderSubtle,
    backgroundColor: tokens.bgSurface,
  },
  modalTitle: {
    flex: 1,
    marginRight: 12,
    fontSize: 18,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalFooterSpacing: {
    height: 40,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: tokens.dangerBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: tokens.dangerText,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 21,
    color: tokens.textSecondary,
  },
  warningItem: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    gap: 4,
  },
  warningName: {
    fontSize: 13,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  warningDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: tokens.textSecondary,
  },
  warningRec: {
    fontSize: 12,
    lineHeight: 18,
    color: tokens.primary,
  },
});
