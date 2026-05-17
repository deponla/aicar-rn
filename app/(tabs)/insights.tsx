import { LegendList } from "@legendapp/list";
import { Colors, tokens, FontFamily, ambientShadow } from "@/constants/theme";
import HomeHeader from "@/components/HomeHeader";
import LoginRequired from "@/components/LoginRequired";
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

// ── Stat Card ──
const StatCard = React.memo(function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

export default function InsightsScreen() {
  const { t } = useTranslation();
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const [selected, setSelected] = useState<AnalyzeMediaLog | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const { data, isLoading, refetch } = useGetAnalysisLogs(undefined, {
    enabled: isLoggedIn,
  });

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

  const stats = useMemo(() => {
    const total = logs.length;
    let critical = 0;
    let warning = 0;
    let ok = 0;
    for (const log of logs) {
      const u = log.aiResponse?.urgency;
      if (u === "critical") critical++;
      else if (u === "warning") warning++;
      else ok++;
    }
    return { total, critical, warning, ok };
  }, [logs]);

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
      <View>
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="bar-chart"
            iconBg={tokens.primaryLight}
            iconColor={Colors.primary}
            label={t("history.stats.total")}
            value={stats.total}
          />
          <StatCard
            icon="error"
            iconBg={tokens.dangerBg}
            iconColor={tokens.danger}
            label={t("history.urgency.critical")}
            value={stats.critical}
          />
          <StatCard
            icon="flash-on"
            iconBg={tokens.warningBg}
            iconColor={tokens.warning}
            label={t("history.urgency.warning")}
            value={stats.warning}
          />
          <StatCard
            icon="check-circle"
            iconBg="#ECFDF5"
            iconColor={tokens.success}
            label="OK"
            value={stats.ok}
          />
        </View>

        {/* Section header + filter chips */}
        <Text style={styles.sectionHeader}>{t("history.title")}</Text>
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
      </View>
    ),
    [filters, urgencyFilter, stats, t],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="bar-chart" size={64} color={tokens.textTertiary} />
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
    <View style={styles.screen}>
      <HomeHeader />

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
    </View>
  );
}

function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 4,
    ...ambientShadow,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontFamily: FontFamily.extraBold,
    fontSize: 22,
    color: tokens.textPrimary,
  },
  statLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: tokens.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionHeader: {
    fontFamily: FontFamily.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: tokens.textPrimary,
    marginBottom: 10,
  },
  // ── Filters ──
  filterRow: {
    marginBottom: 14,
  },
  filterContent: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: tokens.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: tokens.primary,
    borderColor: tokens.primary,
  },
  filterChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  listSeparator: {
    height: 10,
  },
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...ambientShadow,
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
    backgroundColor: `${Colors.secondaryContainer}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: tokens.textPrimary,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  summary: {
    fontFamily: FontFamily.regular,
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
    fontFamily: FontFamily.medium,
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
    fontFamily: FontFamily.bold,
    fontSize: 11,
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
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: tokens.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
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
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
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
    fontFamily: FontFamily.regular,
    color: tokens.dangerText,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 16,
    gap: 6,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textPrimary,
    letterSpacing: 0.7,
  },
  sectionContent: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textSecondary,
  },
  warningItem: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    ...ambientShadow,
    gap: 4,
  },
  warningName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: tokens.textPrimary,
  },
  warningDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  warningRec: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
    color: tokens.secondary,
  },
});
