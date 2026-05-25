import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { LegendList } from '@legendapp/list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { tokens, FontFamily, Colors, ambientShadow } from '@/constants/theme';
import HomeHeader from '@/components/HomeHeader';
import { useGetCars } from '@/query-hooks/useCars';
import { getAssetMediaType } from '@/services/CloudflareUploadService';
import { analyzeAsset } from '@/services/AIAnalysisService';
import {
  CreditQueryKeys,
  useGetCreditBalance,
} from '@/query-hooks/useCreditBalance';
import { useAuthStore } from '@/store/useAuth';
import { useCreditsStore } from '@/store/useCredits';
import {
  AiAnalysisType,
  AiMediaType,
  type AiAnalysisPayload,
  type AnalyzeMediaResponse,
} from '@/types/ai';
import { AuthStatusEnum } from '@/types/auth';
import { type Car } from '@/types/car';
import { type CreditBalanceResponse } from '@/types/credit';
import { syncPermissions } from '@/utils/deviceRegistration';

type SelectedMediaPreview = {
  localUri: string;
  mediaType: AiMediaType;
  fileName?: string | null;
  thumbnailUrl?: string;
};

type ScanSource = 'camera' | 'video' | 'gallery';

const MAX_VIDEO_DURATION_SECONDS = 30;

const SHEET_DISMISS_DELAY_MS = 180;

function createCreditsSnapshot(balance: CreditBalanceResponse) {
  const existingCredits = useCreditsStore.getState().credits;

  return {
    remaining: balance.remainingCredits,
    total: existingCredits
      ? Math.max(existingCredits.total, balance.remainingCredits)
      : balance.remainingCredits,
    lastUpdated: new Date().toISOString(),
    isPremium: balance.isPremium,
    premiumExpiresAt: balance.premiumExpiresAt,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getUrgencyTone(
  urgency: AiAnalysisPayload['urgency'] | undefined,
  translate: (key: string) => string,
) {
  switch (urgency) {
    case 'critical':
      return {
        backgroundColor: tokens.dangerBg,
        textColor: tokens.dangerText,
        label: translate('history.urgency.critical'),
      };
    case 'warning':
      return {
        backgroundColor: tokens.warningBg,
        textColor: tokens.warningText,
        label: translate('history.urgency.warning'),
      };
    default:
      return {
        backgroundColor: tokens.successBg,
        textColor: tokens.successText,
        label: translate('history.urgency.info'),
      };
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function toPermissionStatus(status: string): 'granted' | 'denied' | 'undetermined' {
  if (status === 'granted') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  return 'undetermined';
}

export default function ScanScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { t: translate } = useTranslation();
  const sourceSheetRef = useRef<BottomSheetModal>(null);
  const { status, user } = useAuthStore();
  const setCredits = useCreditsStore((state) => state.setCredits);
  const router = useRouter();
  const creditBalanceQuery = useGetCreditBalance({
    enabled: status === AuthStatusEnum.LOGGED_IN && !!user,
  });
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaPreview | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeMediaResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const isAuthenticated = status === AuthStatusEnum.LOGGED_IN && !!user;
  const carsQuery = useGetCars(undefined, { enabled: isAuthenticated });
  const cars = useMemo(() => carsQuery.data?.results ?? [], [carsQuery.data?.results]);

  const isBusy = isUploading;
  const creditBalance = creditBalanceQuery.data ?? null;
  const analysisPayload = analysis?.result.aiResponse;
  const urgencyTone = useMemo(
    () => getUrgencyTone(analysisPayload?.urgency, translate),
    [analysisPayload?.urgency, translate],
  );
  const shouldShowBalance = useMemo(
    () => isAuthenticated && !!creditBalance,
    [creditBalance, isAuthenticated],
  );
  useEffect(() => {
    if (!creditBalance) {
      return;
    }

    setCredits(createCreditsSnapshot(creditBalance));
  }, [creditBalance, setCredits]);

  const closeSourceSheet = useCallback(() => {
    sourceSheetRef.current?.dismiss();
  }, []);

  const openSourceSheet = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert(
        translate('scanScreen.alerts.loginRequiredTitle'),
        translate('scanScreen.alerts.loginRequiredMessage'),
      );
      return;
    }

    sourceSheetRef.current?.present();
  }, [isAuthenticated, translate]);

  const pickAssetFromSource = useCallback(async (
    source: ScanSource,
  ): Promise<ImagePicker.ImagePickerAsset | null> => {
    if (source === 'gallery') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      void syncPermissions({ mediaLibrary: toPermissionStatus(permission.status) });

      if (permission.status !== 'granted') {
        Alert.alert(
          translate('scanScreen.alerts.permissionRequiredTitle'),
          translate('scanScreen.alerts.galleryPermissionMessage'),
        );
        return null;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
        videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
      });

      if (pickerResult.canceled || !pickerResult.assets[0]) {
        return null;
      }

      return pickerResult.assets[0];
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    void syncPermissions({ camera: toPermissionStatus(permission.status) });

    if (permission.status !== 'granted') {
      Alert.alert(
        translate('scanScreen.alerts.permissionRequiredTitle'),
        source === 'video'
          ? translate('scanScreen.alerts.videoPermissionMessage')
          : translate('scanScreen.alerts.cameraPermissionMessage'),
      );
      return null;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes:
        source === 'video'
          ? ['videos']
          : ['images'],
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]) {
      return null;
    }

    return pickerResult.assets[0];
  }, [translate]);

  const processSelectedAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    const mediaType = getAssetMediaType(asset);

    setSelectedMedia({
      localUri: asset.uri,
      mediaType,
      fileName: asset.fileName,
    });
    setAnalysis(null);
    setIsUploading(true);

    try {
      const result = await analyzeAsset({
        asset,
        analysisType: AiAnalysisType.GENERAL,
        ...(selectedCarId ? { carId: selectedCarId } : {}),
      });

      setSelectedMedia((current) =>
        current
          ? {
            ...current,
            thumbnailUrl: result.thumbnailUrl,
          }
          : current,
      );

      const nextBalance: CreditBalanceResponse = {
        remainingCredits: result.response.balance.remainingCredits,
        isPremium: result.response.balance.isPremium,
        premiumExpiresAt: result.response.balance.premiumExpiresAt ?? null,
      };

      setAnalysis(result.response);
      setCredits(createCreditsSnapshot(nextBalance));
      queryClient.setQueryData<CreditBalanceResponse>(
        [CreditQueryKeys.BALANCE],
        nextBalance,
      );
    } catch (error) {
      Alert.alert(
        translate('scanScreen.alerts.analysisFailedTitle'),
        getErrorMessage(error, translate('scanScreen.alerts.unexpectedError')),
      );
    } finally {
      setIsUploading(false);
    }
  }, [queryClient, selectedCarId, setCredits, translate]);

  const handleSelectSource = useCallback(async (source: ScanSource) => {
    if (!isAuthenticated) {
      Alert.alert(
        translate('scanScreen.alerts.loginRequiredTitle'),
        translate('scanScreen.alerts.loginRequiredMessage'),
      );
      return;
    }

    closeSourceSheet();
    await sleep(SHEET_DISMISS_DELAY_MS);

    const asset = await pickAssetFromSource(source);
    if (!asset) {
      return;
    }

    await processSelectedAsset(asset);
  }, [closeSourceSheet, isAuthenticated, pickAssetFromSource, processSelectedAsset, translate]);

  const handleSelectCar = useCallback((carId: string | null) => {
    setSelectedCarId(carId);
  }, []);

  const carKeyExtractor = useCallback((item: Car) => item.id, []);

  const renderCarChip = useCallback(
    ({ item }: { item: Car }) => (
      <TouchableOpacity
        style={[
          styles.carChip,
          selectedCarId === item.id && styles.carChipSelected,
        ]}
        onPress={() => handleSelectCar(item.id)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.carChipText,
            selectedCarId === item.id && styles.carChipTextSelected,
          ]}
        >
          {item.brand} {item.model} ({item.year})
        </Text>
      </TouchableOpacity>
    ),
    [handleSelectCar, selectedCarId],
  );

  const carListHeader = useMemo(
    () => (
      <TouchableOpacity
        style={[
          styles.carChip,
          selectedCarId === null && styles.carChipSelected,
        ]}
        onPress={() => handleSelectCar(null)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.carChipText,
            selectedCarId === null && styles.carChipTextSelected,
          ]}
        >
          {translate('scanScreen.noCar')}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelectCar, selectedCarId, translate],
  );

  return (
    <>
      <HomeHeader />

      <LegendList
        estimatedItemSize={900}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom + 112, 124),
          },
        ]}
      >
        <View style={styles.heroCard}>
          <MaterialIcons name="center-focus-strong" size={72} color={Colors.secondaryContainer} />
          <Text style={styles.title}>{translate('scanScreen.title')}</Text>
          <Text style={styles.subtitle}>
            {translate('scanScreen.subtitle')}
          </Text>

          <TouchableOpacity
            style={[styles.button, isBusy ? styles.buttonDisabled : null]}
            disabled={isBusy}
            onPress={openSourceSheet}
            activeOpacity={0.85}
          >
            {isBusy ? (
              <ActivityIndicator color={tokens.textInverse} />
            ) : (
              <Text style={styles.buttonText}>{translate('scanScreen.startButton')}</Text>
            )}
          </TouchableOpacity>
          {shouldShowBalance &&
            creditBalance !== null &&
            creditBalance.remainingCredits <= 2 && (
              <TouchableOpacity
                style={styles.lowCreditBanner}
                onPress={() => router.push('/credits')}
                activeOpacity={0.8}
              >
                <Text style={styles.lowCreditText}>
                  {translate('scanScreen.lowCreditBanner')}
                </Text>
              </TouchableOpacity>
            )}
        </View>

        {selectedMedia ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{translate('scanScreen.selectedMedia')}</Text>
            {selectedMedia.mediaType === AiMediaType.IMAGE || selectedMedia.thumbnailUrl ? (
              <Image
                source={{ uri: selectedMedia.thumbnailUrl ?? selectedMedia.localUri }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <MaterialIcons name="videocam" size={32} color={tokens.primary} />
                <Text style={styles.videoPlaceholderText}>{translate('scanScreen.videoSelected')}</Text>
              </View>
            )}
            <Text style={styles.mediaMetaText}>
              {selectedMedia.mediaType === AiMediaType.VIDEO
                ? translate('scanScreen.videoAnalysis')
                : translate('scanScreen.imageAnalysis')}
            </Text>
            {selectedMedia.fileName ? (
              <Text style={styles.mediaMetaSubtext}>{selectedMedia.fileName}</Text>
            ) : null}
          </View>
        ) : null}

        {analysis && analysisPayload ? (
          <View style={styles.resultCard}>
            {/* Urgency Header */}
            <View style={styles.resultUrgencyRow}>
              <View style={[styles.resultIconBox, { backgroundColor: urgencyTone.backgroundColor }]}>
                <MaterialIcons
                  name={analysisPayload.urgency === 'critical' ? 'warning' : analysisPayload.urgency === 'warning' ? 'error-outline' : 'check-circle'}
                  size={28}
                  color={urgencyTone.textColor}
                />
              </View>
              <View style={styles.resultUrgencyInfo}>
                <Text style={[styles.resultUrgencyLabel, { color: urgencyTone.textColor }]}>
                  {urgencyTone.label.toUpperCase()}
                </Text>
                <Text style={styles.resultTitle}>{analysisPayload.title}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.resultDescBox}>
              <Text style={styles.resultDescText}>{analysisPayload.description}</Text>
            </View>

            {/* Steps - "Ne Yapmalısın?" */}
            {analysisPayload.warnings && analysisPayload.warnings.length > 0 ? (
              <View style={styles.stepsSection}>
                <View style={styles.stepsSectionHeader}>
                  <MaterialIcons name="tune" size={18} color={tokens.textPrimary} />
                  <Text style={styles.stepsSectionTitle}>{translate('scanScreen.stepsTitle')}</Text>
                </View>
                {analysisPayload.warnings.map((warning, index) => (
                  <View key={`${warning.name}-${index}`} style={styles.stepItem}>
                    <View style={[styles.stepBorder, { borderColor: urgencyTone.textColor }]} />
                    <View style={[styles.stepNumber, { backgroundColor: urgencyTone.backgroundColor }]}>
                      <Text style={[styles.stepNumberText, { color: urgencyTone.textColor }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepText}>{warning.description}</Text>
                      {warning.recommendation ? (
                        <Text style={styles.stepRecText}>{warning.recommendation}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Bottom info cards */}
            <View style={styles.infoCardsRow}>
              <View style={[styles.infoCard, { backgroundColor: urgencyTone.backgroundColor }]}>
                <MaterialIcons name="flash-on" size={20} color={urgencyTone.textColor} />
                <Text style={styles.infoCardLabel}>{translate('scanScreen.likelyCause')}</Text>
                <Text style={[styles.infoCardValue, { color: urgencyTone.textColor }]}>
                  {analysisPayload.warnings?.[0]?.name ?? analysisPayload.title}
                </Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: tokens.bgSubtle }]}>
                <MaterialIcons name="schedule" size={20} color={tokens.textSecondary} />
                <Text style={styles.infoCardLabel}>{translate('scanScreen.damageRisk')}</Text>
                <Text style={styles.infoCardValue}>
                  {analysisPayload.urgency === 'critical'
                    ? translate('scanScreen.risk.high')
                    : analysisPayload.urgency === 'warning'
                      ? translate('scanScreen.risk.medium')
                      : translate('scanScreen.risk.low')}
                </Text>
              </View>
            </View>

            {/* Recommendation */}
            {analysisPayload.recommendation ? (
              <View style={styles.resultRecBox}>
                <Text style={styles.sectionLabel}>{translate('history.sections.recommendation')}</Text>
                <Text style={styles.resultBody}>{analysisPayload.recommendation}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </LegendList>

      <BottomSheetModal
        ref={sourceSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.18}
          />
        )}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView
          style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{translate('scanScreen.sheetTitle')}</Text>
            <Text style={styles.sheetSubtitle}>
              {translate('scanScreen.sheetSubtitle')}
            </Text>
          </View>

          {isAuthenticated && cars.length > 0 ? (
            <View style={styles.carSection}>
              <Text style={styles.carSectionTitle}>{translate('scanScreen.linkCar')}</Text>
              <LegendList
                horizontal
                data={cars}
                renderItem={renderCarChip}
                keyExtractor={carKeyExtractor}
                estimatedItemSize={120}
                recycleItems
                style={styles.carScroll}
                contentContainerStyle={styles.carScrollContent}
                ListHeaderComponent={carListHeader}
                ListHeaderComponentStyle={styles.carChipHeaderSpacing}
                ItemSeparatorComponent={CarChipSeparator}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ) : null}

          <View style={styles.sourceOptions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sourceOption}
              disabled={isBusy}
              onPress={() => void handleSelectSource('camera')}
            >
              <View style={styles.sourceOptionIcon}>
                <MaterialIcons name="photo-camera" size={22} color={tokens.primary} />
              </View>
              <View style={styles.sourceOptionBody}>
                <Text style={styles.sourceOptionTitle}>{translate('scanScreen.cameraTitle')}</Text>
                <Text style={styles.sourceOptionDescription}>
                  {translate('scanScreen.cameraDescription')}
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={tokens.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sourceOption}
              disabled={isBusy}
              onPress={() => void handleSelectSource('video')}
            >
              <View style={styles.sourceOptionIcon}>
                <MaterialIcons name="videocam" size={22} color={tokens.primary} />
              </View>
              <View style={styles.sourceOptionBody}>
                <Text style={styles.sourceOptionTitle}>{translate('scanScreen.videoTitle')}</Text>
                <Text style={styles.sourceOptionDescription}>
                  {translate('scanScreen.videoDescription')}
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={tokens.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.sourceOption}
              disabled={isBusy}
              onPress={() => void handleSelectSource('gallery')}
            >
              <View style={styles.sourceOptionIcon}>
                <MaterialIcons name="photo-library" size={22} color={tokens.primary} />
              </View>
              <View style={styles.sourceOptionBody}>
                <Text style={styles.sourceOptionTitle}>{translate('scanScreen.galleryTitle')}</Text>
                <Text style={styles.sourceOptionDescription}>
                  {translate('scanScreen.galleryDescription')}
                </Text>
              </View>
              <MaterialIcons name="keyboard-arrow-right" size={24} color={tokens.textTertiary} />
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

function CarChipSeparator() {
  return <View style={styles.carChipSeparator} />;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: tokens.bgBase,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    backgroundColor: tokens.bgBase,
    gap: 16,
  },
  heroCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...ambientShadow,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.56,
    color: tokens.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: tokens.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    color: tokens.textInverse,
    fontSize: 14,
    letterSpacing: 0.7,
  },
  lowCreditBanner: {
    marginTop: 10,
    backgroundColor: tokens.warningBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  lowCreditText: {
    fontFamily: FontFamily.medium,
    color: tokens.warningText,
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    ...ambientShadow,
  },
  // ── Result Card (M3 design) ──
  resultCard: {
    backgroundColor: tokens.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    ...ambientShadow,
  },
  resultUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  resultIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultUrgencyInfo: {
    flex: 1,
    gap: 4,
  },
  resultUrgencyLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  resultTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.56,
    color: tokens.textPrimary,
  },
  resultConfidence: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.secondary,
    letterSpacing: 0.7,
  },
  resultDescBox: {
    backgroundColor: tokens.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
  },
  resultDescText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textSecondary,
  },
  stepsSection: {
    gap: 12,
  },
  stepsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepsSectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textSecondary,
    letterSpacing: 0.7,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: tokens.surfaceContainer,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: tokens.borderDefault,
  },
  stepBorder: {
    display: 'none',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepText: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: tokens.textPrimary,
    lineHeight: 24,
  },
  stepRecText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: tokens.textSecondary,
    lineHeight: 19,
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  infoCardLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: tokens.textSecondary,
    marginTop: 8,
  },
  infoCardValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textPrimary,
    letterSpacing: 0.7,
  },
  resultRecBox: {
    gap: 6,
  },
  // ── Shared ──
  sheetBackground: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 32,
  },
  sheetIndicator: {
    backgroundColor: tokens.borderDefault,
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  carSection: {
    marginBottom: 6,
  },
  carSectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: tokens.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  carScroll: {
    maxHeight: 44,
  },
  carScrollContent: {
    paddingRight: 4,
  },
  carChipHeaderSpacing: {
    marginRight: 8,
  },
  carChipSeparator: {
    width: 8,
  },
  carChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: tokens.borderDefault,
    backgroundColor: tokens.surfaceContainerLow,
    marginRight: 8,
  },
  carChipSelected: {
    borderColor: Colors.secondaryContainer,
    backgroundColor: `${Colors.secondaryContainer}18`,
  },
  carChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: tokens.textSecondary,
  },
  carChipTextSelected: {
    color: tokens.onSecondaryContainer,
  },
  sheetHeader: {
    gap: 6,
    marginBottom: 14,
  },
  sheetTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.22,
    color: tokens.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  sourceOptions: {
    gap: 12,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: tokens.surfaceContainerLowest,
    ...ambientShadow,
  },
  sourceOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.surfaceContainer,
  },
  sourceOptionBody: {
    flex: 1,
    gap: 4,
  },
  sourceOptionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  sourceOptionDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.textSecondary,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    color: tokens.textPrimary,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginTop: 16,
    backgroundColor: tokens.bgMuted,
  },
  videoPlaceholder: {
    marginTop: 16,
    borderRadius: 18,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.secondaryContainer}18`,
    gap: 10,
  },
  videoPlaceholderText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: tokens.secondary,
  },
  mediaMetaText: {
    fontFamily: FontFamily.semiBold,
    marginTop: 14,
    fontSize: 16,
    color: tokens.textPrimary,
  },
  mediaMetaSubtext: {
    fontFamily: FontFamily.regular,
    marginTop: 4,
    fontSize: 13,
    color: tokens.textSecondary,
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    color: tokens.surfaceTint,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  resultBody: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textSecondary,
  },
});
