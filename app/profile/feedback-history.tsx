import { LegendList } from "@legendapp/list";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors, tokens } from "@/constants/theme";
import { useGetFeedbacks } from "@/query-hooks/useFeedback";
import { Feedback, FeedbackStatus, FeedbackType } from "@/types/feedback";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATUS_META: Record<
  FeedbackStatus,
  { label: string; bg: string; text: string }
> = {
  [FeedbackStatus.NEW]: {
    label: "Yeni",
    bg: tokens.infoBg,
    text: tokens.infoText,
  },
  [FeedbackStatus.IN_REVIEW]: {
    label: "İnceleniyor",
    bg: tokens.warningBg,
    text: tokens.warningText,
  },
  [FeedbackStatus.RESOLVED]: {
    label: "Çözüldü",
    bg: tokens.successBg,
    text: tokens.successText,
  },
  [FeedbackStatus.CLOSED]: {
    label: "Kapatıldı",
    bg: tokens.bgMuted,
    text: tokens.textSecondary,
  },
};

const TYPE_META: Record<
  FeedbackType,
  { label: string; icon: keyof typeof MaterialIcons.glyphMap }
> = {
  [FeedbackType.COMPLAINT]: {
    label: "Şikayet",
    icon: "report-problem",
  },
  [FeedbackType.SUGGESTION]: {
    label: "Öneri",
    icon: "lightbulb-outline",
  },
};

const FeedbackCard = React.memo(function FeedbackCard({ item }: { item: Feedback }) {
  const status = STATUS_META[item.status];
  const type = TYPE_META[item.type];
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
            <Text style={styles.typeBadgeText}>{type.label}</Text>
          </View>
          <View style={statusBadgeStyle}>
            <Text style={statusBadgeTextStyle}>{status.label}</Text>
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
          <Text style={styles.noteLabel}>İnceleme notu</Text>
          <Text style={styles.noteText}>{item.adminNotes}</Text>
        </View>
      ) : null}

      {item.resolvedAt ? (
        <Text style={styles.resolvedText}>
          Son durum tarihi: {dayjs(item.resolvedAt).format("DD.MM.YYYY HH:mm")}
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
  const { data, error, isError, isLoading, refetch } = useGetFeedbacks({
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
          <Text style={styles.infoText}>
            Gönderdiğiniz şikayet ve önerilerin durumlarını buradan takip
            edebilirsiniz.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Yeni Geri Bildirim</Text>
        </TouchableOpacity>
      </View>
    ),
    [openCreate],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <MaterialIcons name="inbox" size={48} color="#C7C7CC" />
        <Text style={styles.emptyTitle}>Henüz geri bildirim yok</Text>
        <Text style={styles.emptyText}>
          İlk şikayet veya önerinizi göndererek ekiple doğrudan iletişime
          geçebilirsiniz.
        </Text>
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyActionText}>Geri Bildirim Oluştur</Text>
        </TouchableOpacity>
      </View>
    ),
    [openCreate],
  );

  const listFooter = useMemo(
    () => (
      <>
        {typeof data?.count === "number" && data.count > feedbacks.length ? (
          <Text style={styles.helperText}>
            En son {feedbacks.length} kayıt gösteriliyor.
          </Text>
        ) : null}
        <View style={styles.footerSpacing} />
      </>
    ),
    [data?.count, feedbacks.length],
  );

  return (
    <ScreenContainer
      title="Geri Bildirimlerim"
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
          <Text style={styles.emptyTitle}>Geri bildirimler yüklenemedi</Text>
          <Text style={styles.emptyText}>
            {error instanceof Error
              ? error.message
              : "Lütfen sayfayı yenileyip tekrar deneyin."}
          </Text>
        </View>
      ) : (
        <LegendList
          data={feedbacks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={180}
          recycleItems
          refreshing={isLoading}
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
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginTop: 10,
    marginBottom: 16,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.infoText,
  },
  createButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 16,
    gap: 12,
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
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  messageText: {
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
    fontSize: 12,
    fontWeight: "700",
    color: tokens.textPrimary,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 19,
    color: tokens.textSecondary,
  },
  resolvedText: {
    fontSize: 12,
    color: tokens.textTertiary,
  },
  helperText: {
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
    fontSize: 18,
    fontWeight: "700",
    color: tokens.textPrimary,
    textAlign: "center",
  },
  emptyText: {
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
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
