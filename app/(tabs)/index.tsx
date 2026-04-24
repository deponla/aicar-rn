import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/constants/theme';
import {
  postCompleteAiImageUpload,
  postCompleteAiVideoUpload,
  postInitializeAiImageUpload,
  postInitializeAiVideoUpload,
} from '@/api/post';
import { useAnalyzeMedia } from '@/query-hooks/useAiAnalysis';
import { useAuthStore } from '@/store/useAuth';
import { useCreditsStore } from '@/store/useCredits';
import {
  AiAnalysisType,
  AiMediaType,
  type AiAnalysisPayload,
  type AiUploadCompleteResponse,
  type AnalyzeMediaResponse,
} from '@/types/ai';
import { AuthStatusEnum } from '@/types/auth';

type SelectedMediaPreview = {
  localUri: string;
  mediaType: AiMediaType;
  fileName?: string | null;
  thumbnailUrl?: string;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function getAssetMediaType(asset: ImagePicker.ImagePickerAsset): AiMediaType {
  if (asset.type === 'video' || asset.mimeType?.startsWith('video/')) {
    return AiMediaType.VIDEO;
  }

  return AiMediaType.IMAGE;
}

function getAssetMimeType(
  asset: ImagePicker.ImagePickerAsset,
  mediaType: AiMediaType,
): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  return mediaType === AiMediaType.VIDEO ? 'video/mp4' : 'image/jpeg';
}

function buildAssetFileName(
  asset: ImagePicker.ImagePickerAsset,
  mediaType: AiMediaType,
): string {
  if (asset.fileName) {
    return asset.fileName;
  }

  const extension = mediaType === AiMediaType.VIDEO ? 'mp4' : 'jpg';
  return `scan-${Date.now()}.${extension}`;
}

async function uploadImageAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<AiUploadCompleteResponse> {
  const init = await postInitializeAiImageUpload();
  const formData = new FormData();

  formData.append(
    'file',
    {
      uri: asset.uri,
      name: buildAssetFileName(asset, AiMediaType.IMAGE),
      type: getAssetMimeType(asset, AiMediaType.IMAGE),
    } as unknown as Blob,
  );

  const uploadResponse = await fetch(init.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error('Gorsel yukleme basarisiz oldu.');
  }

  return postCompleteAiImageUpload({ id: init.id });
}

async function resolveVideoUpload(videoId: string): Promise<AiUploadCompleteResponse> {
  let latest: AiUploadCompleteResponse | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    latest = await postCompleteAiVideoUpload({ videoId });

    if (latest.readyToStream !== false) {
      return latest;
    }

    await sleep(2000);
  }

  if (!latest) {
    throw new Error('Video islenemedi.');
  }

  return latest;
}

async function uploadVideoAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<AiUploadCompleteResponse> {
  const init = await postInitializeAiVideoUpload();
  const fileResponse = await fetch(asset.uri);
  const fileBlob = await fileResponse.blob();

  const uploadResponse = await fetch(init.uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': getAssetMimeType(asset, AiMediaType.VIDEO),
    },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Video yukleme basarisiz oldu.');
  }

  return resolveVideoUpload(init.videoId);
}

function getUrgencyTone(urgency?: AiAnalysisPayload['urgency']) {
  switch (urgency) {
    case 'critical':
      return {
        backgroundColor: tokens.dangerBg,
        textColor: tokens.dangerText,
        label: 'Kritik',
      };
    case 'warning':
      return {
        backgroundColor: tokens.warningBg,
        textColor: tokens.warningText,
        label: 'Uyari',
      };
    default:
      return {
        backgroundColor: tokens.successBg,
        textColor: tokens.successText,
        label: 'Bilgi',
      };
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Beklenmeyen bir hata olustu.';
}

export default function ScanScreen() {
  const { status, user } = useAuthStore();
  const credits = useCreditsStore((state) => state.credits);
  const setCredits = useCreditsStore((state) => state.setCredits);
  const analyzeMedia = useAnalyzeMedia();
  const [selectedMedia, setSelectedMedia] = useState<SelectedMediaPreview | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeMediaResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isBusy = isUploading || analyzeMedia.isPending;
  const analysisPayload = analysis?.result.aiResponse;
  const urgencyTone = getUrgencyTone(analysisPayload?.urgency);

  const handleStartScan = async () => {
    if (status !== AuthStatusEnum.LOGGED_IN || !user) {
      Alert.alert('Giris gerekli', 'AI analizini kullanmak icin hesabiniza giris yapin.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Izin gerekli', 'Fotograf veya video secmek icin galeri izni vermelisiniz.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      allowsMultipleSelection: false,
      quality: 1,
      videoMaxDuration: 180,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]) {
      return;
    }

    const asset = pickerResult.assets[0];
    const mediaType = getAssetMediaType(asset);

    setSelectedMedia({
      localUri: asset.uri,
      mediaType,
      fileName: asset.fileName,
    });
    setAnalysis(null);
    setIsUploading(true);

    try {
      const uploadedMedia =
        mediaType === AiMediaType.VIDEO
          ? await uploadVideoAsset(asset)
          : await uploadImageAsset(asset);

      if (uploadedMedia.mediaType === AiMediaType.VIDEO && uploadedMedia.readyToStream === false) {
        throw new Error('Video henuz hazir degil. Lutfen kisa bir sure sonra tekrar deneyin.');
      }

      setSelectedMedia((current) =>
        current
          ? {
            ...current,
            thumbnailUrl: uploadedMedia.thumbnailUrl,
          }
          : current,
      );

      const response = await analyzeMedia.mutateAsync({
        mediaUrl: uploadedMedia.mediaUrl,
        mediaType: uploadedMedia.mediaType,
        thumbnailUrl: uploadedMedia.thumbnailUrl,
        videoId: uploadedMedia.videoId,
        analysisType: AiAnalysisType.GENERAL,
      });

      setAnalysis(response);
      setCredits({
        remaining: response.balance.remainingCredits,
        total: credits ? Math.max(credits.total, response.balance.remainingCredits) : response.balance.remainingCredits,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert('Analiz basarisiz', getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <MaterialIcons name="camera-alt" size={72} color={tokens.primary} />
        <Text style={styles.title}>Aracini Tara</Text>
        <Text style={styles.subtitle}>
          Ikaz lambasi, ariza kodu veya kisa bir video secip yerel AI modeliyle analiz al.
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <MaterialIcons name="bolt" size={16} color={tokens.primary} />
            <Text style={styles.metaBadgeText}>
              {credits ? `${credits.remaining} kredi` : 'Kredi bilgisi hazir degil'}
            </Text>
          </View>
          {analysis?.balance.isPremium ? (
            <View style={[styles.metaBadge, styles.metaBadgeSecondary]}>
              <MaterialIcons name="workspace-premium" size={16} color={tokens.secondary} />
              <Text style={[styles.metaBadgeText, styles.metaBadgeSecondaryText]}>
                Premium aktif
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.button, isBusy ? styles.buttonDisabled : null]}
          disabled={isBusy}
          onPress={handleStartScan}
          activeOpacity={0.85}
        >
          {isBusy ? (
            <ActivityIndicator color={tokens.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Taramayi Baslat</Text>
          )}
        </TouchableOpacity>
      </View>

      {selectedMedia ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Secilen Medya</Text>
          {selectedMedia.mediaType === AiMediaType.IMAGE || selectedMedia.thumbnailUrl ? (
            <Image
              source={{ uri: selectedMedia.thumbnailUrl ?? selectedMedia.localUri }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <MaterialIcons name="videocam" size={32} color={tokens.primary} />
              <Text style={styles.videoPlaceholderText}>Video secildi</Text>
            </View>
          )}
          <Text style={styles.mediaMetaText}>
            {selectedMedia.mediaType === AiMediaType.VIDEO ? 'Video analizi' : 'Fotograf analizi'}
          </Text>
          {selectedMedia.fileName ? (
            <Text style={styles.mediaMetaSubtext}>{selectedMedia.fileName}</Text>
          ) : null}
        </View>
      ) : null}

      {analysis && analysisPayload ? (
        <View style={styles.card}>
          <View style={styles.resultHeader}>
            <Text style={styles.cardTitle}>{analysisPayload.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: urgencyTone.backgroundColor },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: urgencyTone.textColor }]}>
                {urgencyTone.label}
              </Text>
            </View>
          </View>

          <Text style={styles.resultSummary}>{analysisPayload.summary}</Text>
          <Text style={styles.sectionLabel}>Detay</Text>
          <Text style={styles.resultBody}>{analysisPayload.description}</Text>
          <Text style={styles.sectionLabel}>Oneri</Text>
          <Text style={styles.resultBody}>{analysisPayload.recommendation}</Text>

          {analysisPayload.warnings.length > 0 ? (
            <View style={styles.warningList}>
              <Text style={styles.sectionLabel}>Tespit Edilen Uyarilar</Text>
              {analysisPayload.warnings.map((warning, index) => (
                <View key={`${warning.name}-${index}`} style={styles.warningCard}>
                  <Text style={styles.warningTitle}>{warning.name}</Text>
                  <Text style={styles.warningDescription}>{warning.description}</Text>
                  <Text style={styles.warningRecommendation}>{warning.recommendation}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: tokens.bgBase,
    gap: 16,
  },
  heroCard: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: tokens.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.textSecondary,
    textAlign: 'center',
  },
  metaRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    marginBottom: 24,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: tokens.primaryLight,
  },
  metaBadgeSecondary: {
    backgroundColor: '#FDECEF',
  },
  metaBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.primary,
  },
  metaBadgeSecondaryText: {
    color: tokens.secondary,
  },
  button: {
    width: '100%',
    backgroundColor: tokens.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: tokens.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    backgroundColor: tokens.primaryLight,
    gap: 10,
  },
  videoPlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.primary,
  },
  mediaMetaText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.textPrimary,
  },
  mediaMetaSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: tokens.textSecondary,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resultSummary: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: tokens.textPrimary,
  },
  sectionLabel: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
    color: tokens.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultBody: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.textSecondary,
  },
  warningList: {
    marginTop: 8,
    gap: 10,
  },
  warningCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: tokens.warningBg,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.warningText,
  },
  warningDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textPrimary,
  },
  warningRecommendation: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: tokens.textSecondary,
  },
});
