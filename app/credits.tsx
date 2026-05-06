import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { tokens } from "@/constants/theme";
import {
  useGetCreditPackages,
  useGetMyAccount,
  usePurchaseCredits,
} from "@/query-hooks/useCreditBalance";
import { useGetTransactions } from "@/query-hooks/useTransactions";
import { CreditPackage, TransactionPlatformEnum, TransactionStatusEnum } from "@/types/credit";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: TransactionStatusEnum }) {
  const colors: Record<TransactionStatusEnum, { bg: string; text: string; label: string }> = {
    [TransactionStatusEnum.COMPLETED]: { bg: "#D1FAE5", text: "#065F46", label: "Tamamlandı" },
    [TransactionStatusEnum.FAILED]: { bg: "#FEE2E2", text: "#991B1B", label: "Başarısız" },
    [TransactionStatusEnum.PENDING]: { bg: "#FEF9C3", text: "#854D0E", label: "Bekliyor" },
    [TransactionStatusEnum.REFUNDED]: { bg: "#E0E7FF", text: "#3730A3", label: "İade" },
  };
  const cfg = colors[status] ?? colors[TransactionStatusEnum.PENDING];
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

export default function CreditsScreen() {
  const { notify } = useNotification();
  const router = useRouter();

  const accountQuery = useGetMyAccount();
  const packagesQuery = useGetCreditPackages();
  const transactionsQuery = useGetTransactions({ limit: 5, page: 1 });
  const purchaseMutation = usePurchaseCredits();

  const account = accountQuery.data?.result;
  const packages = packagesQuery.data?.results ?? [];
  const transactions = transactionsQuery.data?.results ?? [];

  const handlePurchase = (pkg: CreditPackage) => {
    Alert.alert(
      "Satın Al",
      `${pkg.name} paketini ${pkg.price} ${pkg.currency} karşılığında satın almak istiyor musunuz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Satın Al",
          onPress: () => {
            const platform =
              Platform.OS === "ios"
                ? TransactionPlatformEnum.IOS
                : TransactionPlatformEnum.ANDROID;
            purchaseMutation.mutate(
              { packageId: pkg.id, platform },
              {
                onSuccess: () => {
                  notify({ type: "success", title: "Kredi başarıyla eklendi" });
                },
                onError: (err: unknown) => {
                  const msg =
                    err instanceof Error ? err.message : "Satın alma başarısız oldu.";
                  notify({ type: "error", title: "Hata", message: msg });
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer title="Krediler" showBackButton>
      {/* Balance Card */}
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
                {" "}Kredi
              </Text>
              {account.isPremium && (
                <View style={[styles.premiumBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.premiumBadgeText, { color: "#92400E" }]}>
                    Premium
                    {account.premiumExpiresAt
                      ? ` · ${formatDate(account.premiumExpiresAt)}`
                      : ""}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.usedLabel, { color: tokens.textTertiary }]}>
              Toplam kullanılan: {account.totalCreditsUsed} kredi
            </Text>
          </>
        ) : (
          <Text style={{ color: tokens.textTertiary }}>Bilgi alınamadı.</Text>
        )}
      </View>

      {/* Packages */}
      <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>Paketler</Text>
      {packagesQuery.isLoading ? (
        <ActivityIndicator color={tokens.textPrimary} style={{ marginVertical: 16 }} />
      ) : (
        packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[styles.packageCard, { backgroundColor: tokens.bgSurface }]}
            onPress={() => handlePurchase(pkg)}
            disabled={purchaseMutation.isPending}
            activeOpacity={0.75}
          >
            <View style={styles.packageTop}>
              <Text style={[styles.packageName, { color: tokens.textPrimary }]}>{pkg.name}</Text>
              {pkg.isPopular && (
                <View style={[styles.popularBadge, { backgroundColor: "#DBEAFE" }]}>
                  <Text style={[styles.popularBadgeText, { color: "#1D4ED8" }]}>Popüler</Text>
                </View>
              )}
            </View>
            <Text style={[styles.packageCredits, { color: tokens.textSecondary }]}>
              {pkg.creditAmount} kredi
            </Text>
            <Text style={[styles.packagePrice, { color: tokens.textPrimary }]}>
              {pkg.price} {pkg.currency}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Transaction History */}
      <View style={styles.historyHeader}>
        <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>İşlem Geçmişi</Text>
        <TouchableOpacity>
          <Text style={[styles.allHistoryLink, { color: tokens.textSecondary }]}>
            Tüm geçmiş
          </Text>
        </TouchableOpacity>
      </View>
      {transactionsQuery.isLoading ? (
        <ActivityIndicator color={tokens.textPrimary} style={{ marginVertical: 16 }} />
      ) : transactions.length === 0 ? (
        <Text style={[styles.emptyText, { color: tokens.textTertiary }]}>
          Henüz işlem geçmişi yok.
        </Text>
      ) : (
        transactions.map((tx) => (
          <View
            key={tx.id}
            style={[styles.txRow, { backgroundColor: tokens.bgSurface }]}
          >
            <View style={styles.txLeft}>
              <Text style={[styles.txDate, { color: tokens.textTertiary }]}>
                {formatDate(tx.createdAt)}
              </Text>
              <Text style={[styles.txCredits, { color: tokens.textPrimary }]}>
                +{tx.creditAmount} kredi
              </Text>
            </View>
            <StatusBadge status={tx.status} />
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: "700",
  },
  balanceLabel: {
    fontSize: 20,
    fontWeight: "500",
  },
  premiumBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  usedLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  packageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  packageTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  packageName: {
    fontSize: 15,
    fontWeight: "600",
  },
  popularBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  packageCredits: {
    fontSize: 13,
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: "700",
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
    marginBottom: 8,
  },
  txLeft: {
    gap: 2,
  },
  txDate: {
    fontSize: 12,
  },
  txCredits: {
    fontSize: 15,
    fontWeight: "600",
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 16,
  },
});
