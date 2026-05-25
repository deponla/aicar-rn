import { LegendList } from "@legendapp/list";
import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { tokens, FontFamily, ambientShadow } from "@/constants/theme";
import { normalizeLanguage } from "@/i18n";
import {
  useGetCreditPackages,
  useGetMyAccount,
  usePurchaseCredits,
} from "@/query-hooks/useCreditBalance";
import { useGetTransactions } from "@/query-hooks/useTransactions";
import {
  CreditPackage,
  Transaction,
  TransactionPlatformEnum,
  TransactionStatusEnum,
} from "@/types/credit";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const StatusBadge = React.memo(function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: TransactionStatusEnum;
}) {
  const colors: Record<TransactionStatusEnum, { bg: string; text: string }> = {
    [TransactionStatusEnum.COMPLETED]: { bg: "#D1FAE5", text: "#065F46" },
    [TransactionStatusEnum.FAILED]: { bg: "#FEE2E2", text: "#991B1B" },
    [TransactionStatusEnum.PENDING]: { bg: "#FEF9C3", text: "#854D0E" },
    [TransactionStatusEnum.REFUNDED]: { bg: "#E0E7FF", text: "#3730A3" },
  };
  const config = colors[status] ?? colors[TransactionStatusEnum.PENDING];

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusBadgeText, { color: config.text }]}>{label}</Text>
    </View>
  );
});

type CreditsListItem =
  | { key: string; type: "packages-title"; title: string }
  | { key: string; type: "package"; item: CreditPackage }
  | { key: string; type: "packages-loading" }
  | { key: string; type: "history-header"; title: string; actionLabel: string }
  | { key: string; type: "history-loading" }
  | { key: string; type: "history-empty"; text: string }
  | { key: string; type: "transaction"; item: Transaction };

function ListSeparator() {
  return <View style={styles.listSeparator} />;
}

export default function CreditsScreen() {
  const { t, i18n } = useTranslation();
  const { notify } = useNotification();
  const locale = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  const accountQuery = useGetMyAccount();
  const packagesQuery = useGetCreditPackages();
  const transactionsQuery = useGetTransactions({ limit: 5, page: 1 });
  const purchaseMutation = usePurchaseCredits();

  const account = accountQuery.data?.result ?? null;
  const packages = useMemo(
    () => packagesQuery.data?.results ?? [],
    [packagesQuery.data?.results],
  );
  const transactions = useMemo(
    () => transactionsQuery.data?.results ?? [],
    [transactionsQuery.data?.results],
  );

  const statusLabels = useMemo(
    () => ({
      [TransactionStatusEnum.COMPLETED]: t("credits.status.completed"),
      [TransactionStatusEnum.FAILED]: t("credits.status.failed"),
      [TransactionStatusEnum.PENDING]: t("credits.status.pending"),
      [TransactionStatusEnum.REFUNDED]: t("credits.status.refunded"),
    }),
    [t],
  );

  const handlePurchase = useCallback(
    (pkg: CreditPackage) => {
      Alert.alert(
        t("credits.purchaseTitle"),
        t("credits.purchasePrompt", {
          currency: pkg.currency,
          name: pkg.name,
          price: pkg.price,
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("credits.purchaseConfirm"),
            onPress: () => {
              const platform =
                Platform.OS === "ios"
                  ? TransactionPlatformEnum.IOS
                  : TransactionPlatformEnum.ANDROID;
              purchaseMutation.mutate(
                { packageId: pkg.id, platform },
                {
                  onSuccess: () => {
                    notify({ type: "success", title: t("credits.purchaseSuccess") });
                  },
                  onError: (error: unknown) => {
                    const message =
                      error instanceof Error
                        ? error.message
                        : t("credits.purchaseFailed");
                    notify({
                      type: "error",
                      title: t("common.error"),
                      message,
                    });
                  },
                },
              );
            },
          },
        ],
      );
    },
    [notify, purchaseMutation, t],
  );

  const balanceCard = useMemo(
    () => (
      <View style={[styles.balanceCard, { backgroundColor: tokens.bgSurface }]}>
        {accountQuery.isLoading ? (
          <ActivityIndicator color={tokens.textPrimary} />
        ) : account ? (
          <>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceNumber, { color: tokens.textPrimary }]}>
                {account.remainingCredits}
              </Text>
              <Text style={[styles.balanceLabel, { color: tokens.textSecondary }]}>
                {t("credits.balanceUnit")}
              </Text>
              {account.isPremium ? (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>
                    {t("credits.premium")}
                    {account.premiumExpiresAt
                      ? ` · ${formatDate(account.premiumExpiresAt, locale)}`
                      : ""}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.usedLabel, { color: tokens.textTertiary }]}>
              {t("credits.usedTotal", { count: account.totalCreditsUsed })}
            </Text>
          </>
        ) : (
          <Text style={[styles.emptyText, { color: tokens.textTertiary }]}>
            {t("credits.unavailable")}
          </Text>
        )}
      </View>
    ),
    [account, accountQuery.isLoading, locale, t],
  );

  const listData = useMemo<CreditsListItem[]>(() => {
    const items: CreditsListItem[] = [
      {
        key: "packages-title",
        type: "packages-title",
        title: t("credits.packagesTitle"),
      },
    ];

    if (packagesQuery.isLoading) {
      items.push({ key: "packages-loading", type: "packages-loading" });
    } else {
      items.push(
        ...packages.map((pkg) => ({
          key: `package-${pkg.id}`,
          type: "package" as const,
          item: pkg,
        })),
      );
    }

    items.push({
      key: "history-header",
      type: "history-header",
      title: t("credits.historyTitle"),
      actionLabel: t("credits.allHistory"),
    });

    if (transactionsQuery.isLoading) {
      items.push({ key: "history-loading", type: "history-loading" });
    } else if (transactions.length === 0) {
      items.push({
        key: "history-empty",
        type: "history-empty",
        text: t("credits.emptyHistory"),
      });
    } else {
      items.push(
        ...transactions.map((tx) => ({
          key: `transaction-${tx.id}`,
          type: "transaction" as const,
          item: tx,
        })),
      );
    }

    return items;
  }, [packages, packagesQuery.isLoading, t, transactions, transactionsQuery.isLoading]);

  const renderItem = useCallback(
    ({ item }: { item: CreditsListItem }) => {
      switch (item.type) {
        case "packages-title":
          return (
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
              {item.title}
            </Text>
          );
        case "package":
          return (
            <TouchableOpacity
              style={[styles.packageCard, { backgroundColor: tokens.bgSurface }]}
              onPress={() => handlePurchase(item.item)}
              disabled={purchaseMutation.isPending}
              activeOpacity={0.75}
            >
              <View style={styles.packageTop}>
                <Text style={[styles.packageName, { color: tokens.textPrimary }]}>
                  {item.item.name}
                </Text>
                {item.item.isPopular ? (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{t("credits.popular")}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.packageCredits, { color: tokens.textSecondary }]}>
                {t("credits.packageCredits", { count: item.item.creditAmount })}
              </Text>
              <Text style={[styles.packagePrice, { color: tokens.textPrimary }]}>
                {item.item.price} {item.item.currency}
              </Text>
            </TouchableOpacity>
          );
        case "packages-loading":
          return <ActivityIndicator color={tokens.textPrimary} style={styles.inlineLoader} />;
        case "history-header":
          return (
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>
                {item.title}
              </Text>
              <TouchableOpacity>
                <Text style={[styles.allHistoryLink, { color: tokens.textSecondary }]}>
                  {item.actionLabel}
                </Text>
              </TouchableOpacity>
            </View>
          );
        case "history-loading":
          return <ActivityIndicator color={tokens.textPrimary} style={styles.inlineLoader} />;
        case "history-empty":
          return (
            <Text style={[styles.emptyText, { color: tokens.textTertiary }]}>
              {item.text}
            </Text>
          );
        case "transaction":
          return (
            <View style={[styles.txRow, { backgroundColor: tokens.bgSurface }]}>
              <View style={styles.txLeft}>
                <Text style={[styles.txDate, { color: tokens.textTertiary }]}>
                  {formatDate(item.item.createdAt, locale)}
                </Text>
                <Text style={[styles.txCredits, { color: tokens.textPrimary }]}>
                  {t("credits.transactionCredits", {
                    count: item.item.creditAmount,
                  })}
                </Text>
              </View>
              <StatusBadge
                label={
                  statusLabels[item.item.status] ??
                  statusLabels[TransactionStatusEnum.PENDING]
                }
                status={item.item.status}
              />
            </View>
          );
      }
    },
    [handlePurchase, locale, purchaseMutation.isPending, statusLabels, t],
  );

  const keyExtractor = useCallback((item: CreditsListItem) => item.key, []);

  return (
    <ScreenContainer
      title={t("credits.title")}
      showBackButton
      scrollable={false}
      contentContainerStyle={styles.screenContent}
    >
      <LegendList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={96}
        initialContainerPoolRatio={4}
        recycleItems
        style={styles.listView}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={balanceCard}
        ItemSeparatorComponent={ListSeparator}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  listView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  listSeparator: {
    height: 10,
  },
  inlineLoader: {
    marginVertical: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  balanceNumber: {
    fontSize: 40,
    fontFamily: FontFamily.extraBold,
  },
  balanceLabel: {
    fontSize: 20,
    fontFamily: FontFamily.medium,
  },
  premiumBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEF3C7",
  },
  premiumBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: "#92400E",
  },
  usedLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semiBold,
    marginBottom: 12,
  },
  packageCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: tokens.surfaceContainerLowest,
    ...ambientShadow,
  },
  packageTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  packageName: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  popularBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#DBEAFE",
  },
  popularBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: "#1D4ED8",
  },
  packageCredits: {
    fontSize: 13,
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  allHistoryLink: {
    fontSize: 14,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    padding: 12,
  },
  txLeft: {
    gap: 2,
  },
  txDate: {
    fontSize: 12,
  },
  txCredits: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 16,
  },
});
