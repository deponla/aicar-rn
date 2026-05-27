import { LegendList } from "@legendapp/list";
import ScreenContainer from "@/components/ScreenContainer";
import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import { useGetFeedbacks } from "@/query-hooks/useFeedback";
import { Feedback, FeedbackStatus, FeedbackType } from "@/types/feedback";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useIsFocused, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATUS_META: Record<
  FeedbackStatus,
  { bg: string; text: string }
> = {
  [FeedbackStatus.NEW]: {
    bg: tokens.infoBg,
    text: tokens.infoText,
  },
  [FeedbackStatus.IN_REVIEW]: {
    bg: tokens.warningBg,
    text: tokens.warningText,
  },
  [FeedbackStatus.RESOLVED]: {
    bg: tokens.successBg,
    text: tokens.successText,
  },
  [FeedbackStatus.CLOSED]: {
    bg: tokens.bgMuted,
    text: tokens.textSecondary,
  },
};

const TYPE_META: Record<
  FeedbackType,
  { icon: keyof typeof MaterialIcons.glyphMap }
> = {
  [FeedbackType.COMPLAINT]: {
    icon: "report-problem",
  },
  [FeedbackType.SUGGESTION]: {
    icon: "lightbulb-outline",
  },
};

const FeedbackCard = React.memo(function FeedbackCard({ item }: { item: Feedback }) {
  const { t } = useTranslation();
  const status = STATUS_META[item.status];
  const type = TYPE_META[item.type];
  const statusLabel = t(`feedbackHistory.status.${item.status}`);
  const typeLabel = t(
    item.type === FeedbackType.COMPLAINT
      ? "feedbackScreen.types.complaint.title"
      : "feedbackScreen.types.suggestion.title",
  );
  const statusBadgeStyle = useMemo(
    () => [styles.statusBadge, { backgroundColor: status.bg }],
    [status.bg],
  );
  const statusBadgeTextStyle = useMemo(
    () => [styles.statusBadgeText, { color: status.text }],
    [status.text],
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <MaterialIcons name={type.icon} size={14} color={Colors.primary} />
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
          <View style={statusBadgeStyle}>
            <Text style={statusBadgeTextStyle}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {dayjs(item.createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
      </View>

      <Text style={styles.subjectText}>{item.subject}</Text>
      <Text style={styles.messageText}>{item.message}</Text>

      {item.adminNotes ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>{t("feedbackHistory.reviewNote")}</Text>
          <Text style={styles.noteText}>{item.adminNotes}</Text>
        </View>
      ) : null}

      {item.resolvedAt ? (
        <Text style={styles.resolvedText}>
          {t("feedbackHistory.lastUpdated")}: {dayjs(item.resolvedAt).format("DD.MM.YYYY HH:mm")}
        </Text>
      ) : null}
    </View>
  );
});

function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

export default function FeedbackHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const { data, error, isError, isLoading, isRefetching, refetch } = useGetFeedbacks({
    page: 0,
    limit: 50,
  });

  const feedbacks = useMemo(() => data?.results ?? [], [data?.results]);
  const openCreate = useCallback(() => {
    router.push("/profile/feedback");
  }, [router]);
  const keyExtractor = useCallback((item: Feedback) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: Feedback }) => <FeedbackCard item={item} />,
    [],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.infoCard}>
        <View style={styles.infoContent}>
          <MaterialIcons name="history" size={20} color={tokens.infoText} />
          <Text style={styles.infoText}>{t("feedbackHistory.infoText")}</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={16} color={tokens.textInverse} />
          <Text style={styles.createButtonText}>{t("feedbackHistory.createButton")}</Text>
        </TouchableOpacity>
      </View>
    ),
    [openCreate, t],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <MaterialIcons name="inbox" size={48} color={tokens.textPlaceholder} />
        <Text style={styles.emptyTitle}>{t("feedbackHistory.emptyTitle")}</Text>
        <Text style={styles.emptyText}>{t("feedbackHistory.emptyText")}</Text>
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyActionText}>{t("feedbackHistory.emptyAction")}</Text>
        </TouchableOpacity>
      </View>
    ),
    [openCreate, t],
  );

  const listFooter = (
    <>
      {typeof data?.count === "number" && data.count > feedbacks.length ? (
        <Text style={styles.helperText}>
          {t("feedbackHistory.latestRecords", { count: feedbacks.length })}
        </Text>
      ) : null}
      <View style={styles.footerSpacing} />
    </>
  );

  return (
    <ScreenContainer
      title={t("profileScreen.feedbackHistory")}
      showBackButton
      scrollable={false}
      contentContainerStyle={styles.screenContent}
    >
      {isLoading && data === undefined ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="error-outline"
            size={48}
            color={tokens.dangerText}
          />
          <Text style={styles.emptyTitle}>{t("feedbackHistory.loadErrorTitle")}</Text>
          <Text style={styles.emptyText}>
            {error instanceof Error
              ? error.message
              : t("feedbackHistory.loadErrorFallback")}
          </Text>
        </View>
      ) : (
        <LegendList
          data={feedbacks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={180}
          initialContainerPoolRatio={4}
          recycleItems
          refreshing={isFocused && isRefetching}
          onRefresh={refetch}
          style={styles.listView}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={ListSeparator}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={emptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: tokens.infoBg,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    marginTop: 10,
    marginBottom: 16,
    ...ambientShadow,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.infoText,
  },
  createButton: {
    minHeight: 42,
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  createButtonText: {
    fontFamily: FontFamily.bold,
    color: tokens.textInverse,
    fontSize: 14,
  },
  loadingContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  listView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  listSeparator: {
    height: 12,
  },
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    ...ambientShadow,
  },
  headerRow: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.primaryLight,
  },
  typeBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  dateText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: tokens.textTertiary,
  },
  subjectText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  messageText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
    color: tokens.textSecondary,
  },
  noteBox: {
    backgroundColor: tokens.bgBase,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  noteLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: tokens.textPrimary,
  },
  noteText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.textSecondary,
  },
  resolvedText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: tokens.textTertiary,
  },
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    textAlign: "center",
    color: tokens.textTertiary,
    marginTop: 12,
  },
  footerSpacing: {
    height: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: tokens.textSecondary,
    paddingHorizontal: 24,
  },
  emptyAction: {
    marginTop: 6,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyActionText: {
    fontFamily: FontFamily.bold,
    color: tokens.textInverse,
    fontSize: 14,
  },
});
