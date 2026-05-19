import HomeHeader from "@/components/HomeHeader";
import LoginRequired from "@/components/LoginRequired";
import { Colors, FontFamily, ambientShadow, tokens } from "@/constants/theme";
import { normalizeLanguage } from "@/i18n";
import { useGetAnalysisLogs } from "@/query-hooks/useAnalysisLogs";
import { useGetCarReminders } from "@/query-hooks/useCarReminders";
import { useGetCars } from "@/query-hooks/useCars";
import { useAuthStore } from "@/store/useAuth";
import { AnalyzeMediaLog } from "@/types/ai";
import { AuthStatusEnum } from "@/types/auth";
import {
  CarReminder,
  CarReminderStatusEnum,
  CarReminderTypeEnum,
} from "@/types/car-reminder";
import { Car } from "@/types/car";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DashboardPeriod = "weekly" | "monthly" | "yearly";
type FindingCategoryKey = "powertrain" | "electronics" | "fluids" | "tires";

type ActivityBucket = {
  key: string;
  label: string;
  start: string;
  end: string;
  count: number;
};

type FindingCategory = {
  key: FindingCategoryKey;
  label: string;
  percentage: number;
  count: number;
};

const LOCALE_TAGS = {
  de: "de-DE",
  en: "en-US",
  tr: "tr-TR",
} as const;

const PERIODS: DashboardPeriod[] = ["weekly", "monthly", "yearly"];

const FINDING_KEYWORDS: Record<FindingCategoryKey, string[]> = {
  powertrain: [
    "engine",
    "motor",
    "emission",
    "emisyon",
    "misfire",
    "combustion",
    "ignition",
    "spark",
    "egzoz",
    "exhaust",
    "silindir",
  ],
  electronics: [
    "battery",
    "akü",
    "sensor",
    "sensör",
    "electronic",
    "elektronik",
    "module",
    "modül",
    "ecu",
    "wiring",
    "voltage",
    "charging",
  ],
  fluids: [
    "fluid",
    "liquid",
    "sıvı",
    "coolant",
    "antifreeze",
    "oil",
    "yağ",
    "washer",
    "hydraulic",
    "soğutma",
    "brake fluid",
  ],
  tires: [
    "tire",
    "tyre",
    "lastik",
    "brake",
    "fren",
    "pad",
    "balata",
    "rotor",
    "alignment",
    "pressure",
  ],
};

function getLocaleTag(language: keyof typeof LOCALE_TAGS) {
  return LOCALE_TAGS[language] ?? LOCALE_TAGS.en;
}

function formatCompactLabel(label: string) {
  return label.replace(/\./g, "");
}

function formatNumber(value: number, localeTag: string) {
  return new Intl.NumberFormat(localeTag).format(value);
}

function formatAbsoluteDate(date: string, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatRelativeDate(daysRemaining: number, localeTag: string) {
  const formatter = new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" });

  if (Math.abs(daysRemaining) >= 60) {
    return formatter.format(Math.round(daysRemaining / 30), "month");
  }

  if (Math.abs(daysRemaining) >= 14) {
    return formatter.format(Math.round(daysRemaining / 7), "week");
  }

  return formatter.format(daysRemaining, "day");
}

function buildActivityBuckets(
  period: DashboardPeriod,
  localeTag: string,
  logs: AnalyzeMediaLog[],
): ActivityBucket[] {
  const monthFormatter = new Intl.DateTimeFormat(localeTag, { month: "short" });
  const weekFormatter = new Intl.DateTimeFormat(localeTag, { weekday: "short" });

  if (period === "weekly") {
    return Array.from({ length: 7 }, (_, index) => {
      const start = dayjs().startOf("day").subtract(6 - index, "day");
      const end = start.endOf("day");
      const count = logs.filter((log) => {
        const createdAt = dayjs(log.createdAt);
        return createdAt.isAfter(start.subtract(1, "millisecond")) && createdAt.isBefore(end.add(1, "millisecond"));
      }).length;

      return {
        key: `day-${start.toISOString()}`,
        label: formatCompactLabel(weekFormatter.format(start.toDate())),
        start: start.toISOString(),
        end: end.toISOString(),
        count,
      };
    });
  }

  if (period === "monthly") {
    return Array.from({ length: 6 }, (_, index) => {
      const start = dayjs().startOf("day").subtract((5 - index) * 7, "day");
      const end = start.add(6, "day").endOf("day");
      const count = logs.filter((log) => {
        const createdAt = dayjs(log.createdAt);
        return createdAt.isAfter(start.subtract(1, "millisecond")) && createdAt.isBefore(end.add(1, "millisecond"));
      }).length;

      return {
        key: `week-${start.toISOString()}`,
        label: `${start.format("DD")}-${end.format("DD")}`,
        start: start.toISOString(),
        end: end.toISOString(),
        count,
      };
    });
  }

  return Array.from({ length: 6 }, (_, index) => {
    const start = dayjs().startOf("month").subtract(5 - index, "month");
    const end = start.endOf("month");
    const count = logs.filter((log) => {
      const createdAt = dayjs(log.createdAt);
      return createdAt.isAfter(start.subtract(1, "millisecond")) && createdAt.isBefore(end.add(1, "millisecond"));
    }).length;

    return {
      key: `month-${start.toISOString()}`,
      label: formatCompactLabel(monthFormatter.format(start.toDate())),
      start: start.toISOString(),
      end: end.toISOString(),
      count,
    };
  });
}

function selectClosestReminder(reminders: CarReminder[], currentMileage?: number) {
  return [...reminders].sort((left, right) => {
    const leftScore = getReminderScore(left, currentMileage);
    const rightScore = getReminderScore(right, currentMileage);
    return leftScore - rightScore;
  })[0] ?? null;
}

function getReminderScore(reminder: CarReminder, currentMileage?: number) {
  const reminderDaysBefore = reminder.remindDaysBefore ?? 7;
  const reminderMileageBefore = reminder.remindMileageBefore ?? 500;
  const daysRemaining = reminder.nextDueAt
    ? dayjs(reminder.nextDueAt).startOf("day").diff(dayjs().startOf("day"), "day")
    : Number.POSITIVE_INFINITY;
  const mileageRemaining =
    reminder.nextDueMileage != null && currentMileage != null
      ? reminder.nextDueMileage - currentMileage
      : Number.POSITIVE_INFINITY;

  return Math.min(daysRemaining / Math.max(reminderDaysBefore, 1), mileageRemaining / Math.max(reminderMileageBefore, 1));
}

function classifyFinding(text: string): FindingCategoryKey {
  const haystack = text.toLowerCase();
  const match = (Object.entries(FINDING_KEYWORDS) as [FindingCategoryKey, string[]][]).find(
    ([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)),
  );

  return match?.[0] ?? "electronics";
}

function buildFindingDistribution(
  logs: AnalyzeMediaLog[],
  labels: Record<FindingCategoryKey, string>,
): FindingCategory[] {
  const counts: Record<FindingCategoryKey, number> = {
    powertrain: 0,
    electronics: 0,
    fluids: 0,
    tires: 0,
  };

  for (const log of logs) {
    const warningTexts =
      log.aiResponse?.warnings?.map((warning) =>
        [warning.name, warning.description, warning.recommendation]
          .filter(Boolean)
          .join(" "),
      ) ?? [];

    const sources = warningTexts.length > 0
      ? warningTexts
      : [
        [
          log.aiResponse?.title,
          log.aiResponse?.summary,
          log.aiResponse?.description,
        ]
          .filter(Boolean)
          .join(" "),
      ].filter(Boolean);

    for (const source of sources) {
      counts[classifyFinding(source)] += 1;
    }
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (Object.keys(counts) as FindingCategoryKey[])
    .map((key) => ({
      key,
      label: labels[key],
      count: counts[key],
      percentage: total > 0 ? Math.round((counts[key] / total) * 100) : 0,
    }))
    .sort((left, right) => right.count - left.count);
}

function VehicleChip({
  car,
  isSelected,
  onPress,
}: {
  car: Car;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.vehicleChip, isSelected && styles.vehicleChipActive]}
    >
      <Text style={[styles.vehicleChipText, isSelected && styles.vehicleChipTextActive]} numberOfLines={1}>
        {car.brand} {car.model}
      </Text>
      <Text style={[styles.vehicleChipMeta, isSelected && styles.vehicleChipMetaActive]}>
        {car.year}
      </Text>
    </TouchableOpacity>
  );
}

export default function InsightsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authStore = useAuthStore();
  const isLoggedIn = authStore.status === AuthStatusEnum.LOGGED_IN;
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [period, setPeriod] = useState<DashboardPeriod>("yearly");

  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const localeTag = getLocaleTag(language);
  const carsQuery = useGetCars(undefined, { enabled: isLoggedIn });
  const cars = useMemo(() => carsQuery.data?.results ?? [], [carsQuery.data?.results]);

  useEffect(() => {
    if (cars.length === 0) {
      setSelectedCarId(null);
      return;
    }

    setSelectedCarId((current) => {
      if (current && cars.some((car) => car.id === current)) {
        return current;
      }

      return cars[0]?.id ?? null;
    });
  }, [cars]);

  const selectedCar = useMemo(
    () => cars.find((car) => car.id === selectedCarId) ?? null,
    [cars, selectedCarId],
  );

  const analysisQuery = useGetAnalysisLogs(
    selectedCarId
      ? { carId: selectedCarId, limit: 120, sort: "createdAt:desc" }
      : undefined,
    { enabled: isLoggedIn && !!selectedCarId },
  );
  const remindersQuery = useGetCarReminders(
    selectedCarId
      ? {
        carId: selectedCarId,
        status: CarReminderStatusEnum.ACTIVE,
        limit: 50,
        sort: "nextDueAt:asc",
      }
      : undefined,
    { enabled: isLoggedIn && !!selectedCarId },
  );

  const logs = useMemo(() => analysisQuery.data?.results ?? [], [analysisQuery.data?.results]);
  const reminders = useMemo(
    () => remindersQuery.data?.results ?? [],
    [remindersQuery.data?.results],
  );
  const activeReminder = useMemo(
    () => selectClosestReminder(reminders, selectedCar?.currentMileage),
    [reminders, selectedCar?.currentMileage],
  );
  const latestScan = logs[0] ?? null;

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={carsQuery.isRefetching || analysisQuery.isRefetching || remindersQuery.isRefetching}
        onRefresh={() => {
          void Promise.all([
            carsQuery.refetch(),
            analysisQuery.refetch(),
            remindersQuery.refetch(),
          ]);
        }}
        tintColor={Colors.secondary}
      />
    ),
    [analysisQuery, carsQuery, remindersQuery],
  );

  const activityBuckets = useMemo(
    () => buildActivityBuckets(period, localeTag, logs),
    [localeTag, logs, period],
  );
  const chartMax = useMemo(
    () => Math.max(...activityBuckets.map((bucket) => bucket.count), 1),
    [activityBuckets],
  );

  const currentRange = useMemo(() => {
    if (activityBuckets.length === 0) {
      return null;
    }

    return {
      start: dayjs(activityBuckets[0].start),
      end: dayjs(activityBuckets[activityBuckets.length - 1].end),
    };
  }, [activityBuckets]);

  const periodLogs = useMemo(
    () =>
      currentRange
        ? logs.filter((log) => {
          const createdAt = dayjs(log.createdAt);
          return createdAt.isAfter(currentRange.start.subtract(1, "millisecond"))
            && createdAt.isBefore(currentRange.end.add(1, "millisecond"));
        })
        : [],
    [currentRange, logs],
  );

  const findingLabels = useMemo<Record<FindingCategoryKey, string>>(
    () => ({
      powertrain: t("history.dashboard.findings.categories.powertrain"),
      electronics: t("history.dashboard.findings.categories.electronics"),
      fluids: t("history.dashboard.findings.categories.fluids"),
      tires: t("history.dashboard.findings.categories.tires"),
    }),
    [t],
  );

  const findings = useMemo(
    () => buildFindingDistribution(periodLogs, findingLabels),
    [findingLabels, periodLogs],
  );

  const forecastMessage = useMemo(() => {
    if (!activeReminder) {
      return t("history.dashboard.forecast.emptyMessage");
    }

    const reminderType = t(`history.dashboard.reminderTypes.${activeReminder.type}`);
    const daysRemaining = activeReminder.nextDueAt
      ? dayjs(activeReminder.nextDueAt).startOf("day").diff(dayjs().startOf("day"), "day")
      : null;
    const mileageRemaining =
      activeReminder.nextDueMileage != null && selectedCar?.currentMileage != null
        ? activeReminder.nextDueMileage - selectedCar.currentMileage
        : null;

    const hasDateTarget = daysRemaining != null;
    const hasMileageTarget = mileageRemaining != null;

    if (hasDateTarget && hasMileageTarget) {
      const dateScore = daysRemaining / Math.max(activeReminder.remindDaysBefore ?? 7, 1);
      const mileageScore = mileageRemaining / Math.max(activeReminder.remindMileageBefore ?? 500, 1);

      if (dateScore <= mileageScore) {
        return t("history.dashboard.forecast.message", {
          type: reminderType,
          due: formatRelativeDate(daysRemaining, localeTag),
        });
      }

      return t("history.dashboard.forecast.message", {
        type: reminderType,
        due: t("history.dashboard.forecast.mileageRemaining", {
          mileage: formatNumber(Math.abs(mileageRemaining), localeTag),
          qualifier:
            mileageRemaining >= 0
              ? t("history.dashboard.forecast.mileageQualifierRemaining")
              : t("history.dashboard.forecast.mileageQualifierOverdue"),
        }),
      });
    }

    if (hasDateTarget) {
      return t("history.dashboard.forecast.message", {
        type: reminderType,
        due: formatRelativeDate(daysRemaining, localeTag),
      });
    }

    if (hasMileageTarget) {
      return t("history.dashboard.forecast.message", {
        type: reminderType,
        due: t("history.dashboard.forecast.mileageRemaining", {
          mileage: formatNumber(Math.abs(mileageRemaining), localeTag),
          qualifier:
            mileageRemaining >= 0
              ? t("history.dashboard.forecast.mileageQualifierRemaining")
              : t("history.dashboard.forecast.mileageQualifierOverdue"),
        }),
      });
    }

    return t("history.dashboard.forecast.noTargetMessage", {
      type: reminderType,
    });
  }, [activeReminder, localeTag, selectedCar?.currentMileage, t]);

  const isLoading = carsQuery.isLoading
    || (!!selectedCarId && analysisQuery.isLoading && analysisQuery.data === undefined);

  const handleOpenPlanner = useCallback(() => {
    if (!selectedCarId) {
      router.push("/(tabs)/search");
      return;
    }

    router.push({
      pathname: "/maintenance-planner",
      params: {
        carId: selectedCarId,
        ...(activeReminder?.id ? { reminderId: activeReminder.id } : {}),
      },
    });
  }, [activeReminder?.id, router, selectedCarId]);

  const handleStartScan = useCallback(() => {
    router.push("/(tabs)");
  }, [router]);

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle={t("history.dashboard.pageTitle")}
        title={t("history.loginRequiredTitle")}
        description={t("history.loginRequiredDescription")}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <HomeHeader />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: insets.bottom + 190 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            <Text style={styles.pageTitle}>{t("history.dashboard.pageTitle")}</Text>

            {cars.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vehicleSelectorContent}
                  style={styles.vehicleSelector}
                >
                  {cars.map((car) => (
                    <VehicleChip
                      key={car.id}
                      car={car}
                      isSelected={car.id === selectedCarId}
                      onPress={() => setSelectedCarId(car.id)}
                    />
                  ))}
                </ScrollView>

                <View style={styles.segmentedControl}>
                  {PERIODS.map((item) => {
                    const isActive = item === period;

                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        onPress={() => setPeriod(item)}
                        style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                      >
                        <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                          {t(`history.dashboard.periods.${item}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.card}>
                  <View style={styles.forecastHeader}>
                    <View style={styles.forecastLabelRow}>
                      <MaterialIcons name="auto-awesome" size={20} color="#1FC7FF" />
                      <Text style={styles.forecastLabel}>{t("history.dashboard.forecast.label")}</Text>
                    </View>
                    {activeReminder ? (
                      <View style={styles.forecastTypeBadge}>
                        <MaterialIcons
                          name={
                            activeReminder.type === CarReminderTypeEnum.OIL_CHANGE
                              ? "opacity"
                              : activeReminder.type === CarReminderTypeEnum.INSPECTION
                                ? "fact-check"
                                : "build"
                          }
                          size={14}
                          color={Colors.secondary}
                        />
                        <Text style={styles.forecastTypeText}>
                          {t(`history.dashboard.reminderTypes.${activeReminder.type}`)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.forecastTitle}>{forecastMessage}</Text>

                  <View style={styles.forecastMetaBlock}>
                    <Text style={styles.forecastMetaText}>
                      {t("history.dashboard.forecast.lastScan")}: {latestScan ? formatAbsoluteDate(latestScan.createdAt, localeTag) : t("history.dashboard.forecast.noScans")}
                    </Text>
                    <Text style={styles.forecastMetaText}>
                      {t("history.dashboard.forecast.currentMileage")}: {selectedCar?.currentMileage != null ? `${formatNumber(selectedCar.currentMileage, localeTag)} km` : t("history.dashboard.forecast.noMileage")}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.forecastButton} activeOpacity={0.9} onPress={handleOpenPlanner}>
                    <MaterialIcons name="calendar-month" size={18} color={tokens.textInverse} />
                    <Text style={styles.forecastButtonText}>{t("history.dashboard.forecast.cta")}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{t("history.dashboard.activity.title")}</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusBadgeDot} />
                      <Text style={styles.statusBadgeText}>
                        {periodLogs.length > 0
                          ? t("history.dashboard.activity.active")
                          : t("history.dashboard.activity.idle")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chartArea}>
                    {activityBuckets.map((bucket) => (
                      <View key={bucket.key} style={styles.chartColumn}>
                        <View style={styles.chartTrack}>
                          <View
                            style={[
                              styles.chartFill,
                              {
                                height: `${Math.max((bucket.count / chartMax) * 100, bucket.count > 0 ? 10 : 0)}%`,
                                opacity: bucket.count > 0 ? 1 : 0.22,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.chartLabel}>{bucket.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{t("history.dashboard.findings.title")}</Text>
                  {findings.some((item) => item.count > 0) ? (
                    <View style={styles.findingsList}>
                      {findings.map((finding) => (
                        <View key={finding.key} style={styles.findingRow}>
                          <View style={styles.findingHeader}>
                            <Text style={styles.findingLabel}>{finding.label}</Text>
                            <Text style={styles.findingValue}>{finding.percentage}%</Text>
                          </View>
                          <View style={styles.findingTrack}>
                            <View
                              style={[
                                styles.findingFill,
                                { width: `${Math.max(finding.percentage, finding.count > 0 ? 8 : 0)}%` },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.emptyCardText}>{t("history.dashboard.findings.empty")}</Text>
                  )}
                </View>

                {logs.length === 0 ? (
                  <View style={[styles.card, styles.helperCard]}>
                    <Text style={styles.helperTitle}>{t("history.dashboard.emptyTitle")}</Text>
                    <Text style={styles.helperDescription}>{t("history.dashboard.emptyDescription")}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={[styles.card, styles.helperCard]}>
                <Text style={styles.helperTitle}>{t("history.dashboard.noVehicleTitle")}</Text>
                <Text style={styles.helperDescription}>{t("history.dashboard.noVehicleDescription")}</Text>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.secondaryButton}
                  onPress={() => router.push("/(tabs)/search")}
                >
                  <Text style={styles.secondaryButtonText}>{t("history.dashboard.goToGarage")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.floatingActionWrap,
              { bottom: Math.max(insets.bottom + 94, 108) },
            ]}
          >
            <TouchableOpacity style={styles.floatingActionButton} activeOpacity={0.92} onPress={handleStartScan}>
              <MaterialIcons name="document-scanner" size={24} color={tokens.textInverse} />
              <Text style={styles.floatingActionText}>{t("history.dashboard.scanCta")}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
    color: tokens.textPrimary,
  },
  vehicleSelector: {
    marginTop: -2,
  },
  vehicleSelectorContent: {
    gap: 10,
    paddingRight: 24,
  },
  vehicleChip: {
    minWidth: 128,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: tokens.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    ...ambientShadow,
  },
  vehicleChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  vehicleChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: tokens.textPrimary,
  },
  vehicleChipTextActive: {
    color: tokens.textInverse,
  },
  vehicleChipMeta: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: tokens.textTertiary,
  },
  vehicleChipMetaActive: {
    color: "rgba(255,255,255,0.75)",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0EEEF",
    borderRadius: 9999,
    padding: 4,
    ...ambientShadow,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    paddingVertical: 14,
  },
  segmentButtonActive: {
    backgroundColor: tokens.surfaceContainerLowest,
  },
  segmentText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: tokens.textSecondary,
  },
  segmentTextActive: {
    color: tokens.textPrimary,
  },
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    ...ambientShadow,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: tokens.textPrimary,
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  forecastLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  forecastLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#1FC7FF",
  },
  forecastTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: tokens.infoBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  forecastTypeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: Colors.secondary,
  },
  forecastTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 30,
    color: tokens.textPrimary,
  },
  forecastMetaBlock: {
    gap: 6,
  },
  forecastMetaText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  forecastButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primaryDark,
    borderRadius: 9999,
    paddingVertical: 18,
  },
  forecastButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textInverse,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: tokens.infoBg,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1FC7FF",
  },
  statusBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: "#1FC7FF",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 220,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  chartTrack: {
    width: "100%",
    height: 170,
    justifyContent: "flex-end",
    borderRadius: 18,
    backgroundColor: tokens.bgSubtle,
    overflow: "hidden",
  },
  chartFill: {
    width: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 18,
    minHeight: 4,
  },
  chartLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: tokens.textSecondary,
  },
  findingsList: {
    gap: 18,
  },
  findingRow: {
    gap: 8,
  },
  findingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  findingLabel: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  findingValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  findingTrack: {
    height: 10,
    borderRadius: 9999,
    backgroundColor: tokens.bgSubtle,
    overflow: "hidden",
  },
  findingFill: {
    height: "100%",
    borderRadius: 9999,
    backgroundColor: Colors.primaryDark,
  },
  emptyCardText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: tokens.textSecondary,
  },
  helperCard: {
    alignItems: "flex-start",
  },
  helperTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
    color: tokens.textPrimary,
  },
  helperDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    color: tokens.textSecondary,
  },
  secondaryButton: {
    marginTop: 4,
    backgroundColor: tokens.infoBg,
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.secondary,
  },
  floatingActionWrap: {
    position: "absolute",
    left: 24,
    right: 24,
  },
  floatingActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 9999,
    backgroundColor: Colors.primaryDark,
    paddingVertical: 20,
    ...ambientShadow,
  },
  floatingActionText: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: tokens.textInverse,
  },
});
