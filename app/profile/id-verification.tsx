import { useNotification } from "@/components/Notification";
import ScreenContainer from "@/components/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useIdentityVerification } from "@/query-hooks/useUser";
import { useAuthStore } from "@/store/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { scanMRZ } from "rn-mrz-scanner";
import {
  addPassportReadProgressListener,
  isNFCSupported,
  PassportData,
  readPassport,
} from "rn-passport-reader";

// MRZ parse: TD3 (pasaport, 2x44) ve TD1 (kimlik, 3x30)
function parseMRZ(mrz: string): {
  documentNumber: string;
  dateOfBirth: string;
  dateOfExpiry: string;
} | null {
  const lines = mrz
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 2 && lines[0].length >= 44) {
    // TD3 – Pasaport
    const line2 = lines[1];
    return {
      documentNumber: line2.substring(0, 9).replace(/</g, ""),
      dateOfBirth: line2.substring(13, 19),
      dateOfExpiry: line2.substring(21, 27),
    };
  }

  if (lines.length === 3 && lines[0].length >= 30) {
    // TD1 – Kimlik Kartı
    const line1 = lines[0];
    const line2 = lines[1];
    return {
      documentNumber: line1.substring(5, 14).replace(/</g, ""),
      dateOfBirth: line2.substring(0, 6),
      dateOfExpiry: line2.substring(8, 14),
    };
  }

  return null;
}

type Step = "idle" | "mrz-done" | "reading-nfc" | "done";

const NEUTRAL_ICON_COLOR = "#8E8E93";
const NEUTRAL_ICON_BG = "#F2F2F7";
const NEUTRAL_ICON_ACCENT = "#D1D5DB";
const NEUTRAL_STATUS_BG = "#F5F5F5";
const NEUTRAL_STATUS_TEXT = "#6B7280";

export default function IdVerificationScreen() {
  const router = useRouter();
  const authStore = useAuthStore();
  const user = authStore.user?.user;
  const { notify } = useNotification();
  const identityVerification = useIdentityVerification();

  const [step, setStep] = useState<Step>("idle");
  const [mrzRaw, setMrzRaw] = useState<string | null>(null);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [nfcProgress, setNfcProgress] = useState(0);
  const [nfcMessage, setNfcMessage] = useState("");
  const [nfcStep, setNfcStep] = useState(0);
  const [nfcTotalSteps, setNfcTotalSteps] = useState(8);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = addPassportReadProgressListener((event) => {
      setNfcProgress(event.progress);
      setNfcMessage(event.message);
      setNfcStep(event.step);
      setNfcTotalSteps(event.totalSteps);
      Animated.timing(progressAnim, {
        toValue: event.progress / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
    return () => subscription.remove();
  }, [progressAnim]);

  const handleScanMRZ = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const mrz = await scanMRZ();
      setMrzRaw(mrz);
      setPassportData(null);
      setStep("mrz-done");
    } catch (error: any) {
      if (error?.code !== "ERR_CANCELLED") {
        Alert.alert("Hata", "MRZ taraması sırasında bir hata oluştu.");
      }
    }
  };

  const handleReadNFC = async () => {
    if (!mrzRaw) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isNFCSupported()) {
      Alert.alert(
        "NFC Desteklenmiyor",
        "Bu cihaz NFC özelliğini desteklemiyor.",
      );
      return;
    }

    const parsed = parseMRZ(mrzRaw);
    if (!parsed) {
      Alert.alert("Hata", "MRZ verisi okunamadı. Lütfen tekrar tarayın.");
      return;
    }

    setStep("reading-nfc");
    setNfcProgress(0);
    setNfcMessage("NFC bağlantısı kuruluyor…");
    setNfcStep(0);
    progressAnim.setValue(0);

    try {
      const data = await readPassport(
        parsed.documentNumber,
        parsed.dateOfBirth,
        parsed.dateOfExpiry,
      );
      setPassportData(data);
      setStep("done");
    } catch (error: any) {
      if (error?.code === "ERR_CANCELLED") {
        setStep("mrz-done");
      } else {
        Alert.alert("Hata", "Pasaport/kimlik okuma sırasında bir hata oluştu.");
        setStep("mrz-done");
      }
    }
  };

  const handleConfirmVerification = async () => {
    if (!passportData || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await identityVerification.mutateAsync({
        personalInfo: {
          firstName: passportData.firstName ?? "",
          lastName: passportData.lastName ?? "",
          fullName: passportData.fullName ?? "",
          gender: passportData.gender ?? "",
          nationality: passportData.nationality ?? "",
          dateOfBirth: passportData.dateOfBirth ?? "",
          placeOfBirth: passportData.placeOfBirth ?? "",
          personalNumber: passportData.personalNumber ?? "",
          telephone: passportData.telephone ?? null,
          profession: passportData.profession ?? null,
          title: passportData.title ?? null,
        },
        documentInfo: {
          documentNumber: passportData.documentNumber ?? "",
          serialNumber: passportData.serialNumber ?? "",
          expiryDate: passportData.expiryDate ?? "",
          issuingAuthority: passportData.issuingAuthority ?? "",
          dateOfIssue: passportData.dateOfIssue ?? null,
          endorsements: passportData.endorsements ?? null,
          taxOrExitRequirements: passportData.taxOrExitRequirements ?? null,
        },
        verification: {
          isVerified: passportData.isVerified ?? false,
          activeAuthentication: passportData.activeAuthentication ?? false,
          passiveAuthentication: passportData.passiveAuthentication ?? false,
          nfcDataGroups: passportData.nfcDataGroups ?? [],
        },
        images: {
          faceImageBase64: passportData.faceImageBase64 ?? "",
          signatureImageBase64: passportData.signatureImageBase64 ?? null,
        },
        metadata: {
          scannedAt: new Date().toISOString(),
          mrzRaw: mrzRaw ?? "",
        },
      });

      if (authStore.user) {
        authStore.login({
          ...authStore.user,
          user: {
            ...authStore.user.user,
            isIdentityVerified: result.result?.isIdentityVerified ?? true,
          },
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      notify({
        type: "success",
        title: "Kimlik doğrulandı",
        message: "Kimliğiniz başarıyla kaydedildi.",
      });
      router.back();
    } catch (error: any) {
      notify({
        type: "error",
        title: "Kayıt başarısız",
        message:
          error?.response?.data?.message ||
          "Kimlik doğrulama kaydedilemedi. Lütfen tekrar deneyin.",
      });
    }
  };

  const handleReset = () => {
    setStep("idle");
    setMrzRaw(null);
    setPassportData(null);
    progressAnim.setValue(0);
  };

  // ── Adım 1: Başlangıç ──
  if (step === "idle") {
    return (
      <ScreenContainer title="Kimlik Doğrulama" showBackButton>
        <View style={styles.centerContent}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="badge" size={48} color={NEUTRAL_ICON_COLOR} />
          </View>
          <Text style={styles.heading}>Kimliğinizi Doğrulayın</Text>
          <Text style={styles.description}>
            Pasaportunuzu veya kimlik kartınızı tarayarak hesabınızı
            doğrulayabilirsiniz. Bu işlem iki adımdan oluşur:
          </Text>

          <View style={styles.stepsContainer}>
            <StepInfo
              number="1"
              icon="photo-camera"
              title="MRZ Tarama"
              desc="Belgenin makine okuma şeridini kamerayla tarayın"
            />
            <View style={styles.stepConnector} />
            <StepInfo
              number="2"
              icon="nfc"
              title="NFC ile Okuma"
              desc="Belgenin mikroçipini telefonunuza yaklaştırarak okutun"
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleScanMRZ}
          >
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>MRZ Taramayı Başlat</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ── Adım 2: MRZ tamam → NFC okuma ──
  if (step === "mrz-done") {
    return (
      <ScreenContainer title="Kimlik Doğrulama" showBackButton>
        <View style={styles.centerContent}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="check-circle" size={48} color={NEUTRAL_ICON_COLOR} />
          </View>
          <Text style={styles.heading}>MRZ Tarandı</Text>
          <Text style={styles.description}>
            Belge bilgileri başarıyla okundu. Şimdi NFC ile mikroçipi
            okutabilirsiniz.
          </Text>

          <View style={styles.mrzBox}>
            <Text style={styles.mrzLabel}>Okunan MRZ Verisi</Text>
            <ScrollView style={styles.mrzScroll} nestedScrollEnabled>
              <Text style={styles.mrzText}>{mrzRaw}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: "#0d7377" }]}
            onPress={handleReadNFC}
          >
            <MaterialIcons name="nfc" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>NFC ile Oku</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleScanMRZ}
          >
            <Text style={styles.secondaryButtonText}>Tekrar Tara</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ── Adım 3: NFC okuma devam ediyor ──
  if (step === "reading-nfc") {
    return (
      <ScreenContainer title="Kimlik Doğrulama" showBackButton>
        <View style={styles.centerContent}>
          <View style={styles.progressCircle}>
            <View style={styles.progressCircleInner}>
              <Text style={styles.progressPercent}>{nfcProgress}%</Text>
              <Text style={styles.progressStepText}>
                {nfcStep}/{nfcTotalSteps}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          <Text style={styles.nfcMessage}>{nfcMessage}</Text>
          <Text style={styles.nfcHint}>
            Belgenizi telefonun arkasına yaklaştırın ve okuma tamamlanana kadar
            tutun…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Adım 4: Sonuç ──
  const d = passportData!;
  return (
    <ScreenContainer
      title="Kimlik Doğrulama"
      showBackButton
      contentContainerStyle={{ backgroundColor: "#F5F6F8" }}
    >
      <View
        style={[
          styles.resultBadge,
          { backgroundColor: NEUTRAL_STATUS_BG },
        ]}
      >
        <MaterialIcons
          name={d.isVerified ? "verified-user" : "gpp-bad"}
          size={22}
          color={NEUTRAL_ICON_COLOR}
        />
        <Text style={[styles.resultBadgeText, { color: NEUTRAL_STATUS_TEXT }]}>
          {d.isVerified ? "Belge Doğrulandı" : "Belge Doğrulanamadı"}
        </Text>
      </View>

      {/* Fotoğraf */}
      {d.faceImageBase64 ? (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${d.faceImageBase64}` }}
            style={styles.faceImage}
          />
        </View>
      ) : null}

      {/* Kişisel bilgiler */}
      <ResultCard title="Kişisel Bilgiler" icon="person">
        <ResultRow label="Ad" value={d.firstName} />
        <ResultRow label="Soyad" value={d.lastName} />
        {d.fullName ? <ResultRow label="Tam Ad" value={d.fullName} /> : null}
        <ResultRow label="Cinsiyet" value={d.gender} />
        <ResultRow label="Uyruk" value={d.nationality} />
        <ResultRow label="Doğum Tarihi" value={d.dateOfBirth} />
        {d.placeOfBirth ? (
          <ResultRow label="Doğum Yeri" value={d.placeOfBirth} />
        ) : null}
        {d.personalNumber ? (
          <ResultRow label="TC / Kişisel No" value={d.personalNumber} />
        ) : null}
      </ResultCard>

      {/* Belge bilgileri */}
      <ResultCard title="Belge Bilgileri" icon="badge">
        <ResultRow label="Belge No" value={d.documentNumber} />
        <ResultRow label="Seri No" value={d.serialNumber} />
        <ResultRow label="Son Geçerlilik" value={d.expiryDate} />
        {d.issuingAuthority ? (
          <ResultRow label="Düzenleyen" value={d.issuingAuthority} />
        ) : null}
        {d.dateOfIssue ? (
          <ResultRow label="Düzenleme Tarihi" value={d.dateOfIssue} />
        ) : null}
      </ResultCard>

      {/* Güvenlik */}
      <ResultCard title="Güvenlik" icon="shield">
        <ResultRow
          label="Aktif Doğrulama"
          value={d.activeAuthentication ? "Evet" : "Hayır"}
        />
        <ResultRow
          label="Pasif Doğrulama"
          value={d.passiveAuthentication ? "Evet" : "Hayır"}
        />
        {d.nfcDataGroups?.length ? (
          <ResultRow label="Veri Grupları" value={d.nfcDataGroups.join(", ")} />
        ) : null}
      </ResultCard>

      {/* Onay butonu */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          { marginHorizontal: 0, marginTop: 8 },
          identityVerification.isPending && { opacity: 0.7 },
        ]}
        onPress={handleConfirmVerification}
        disabled={identityVerification.isPending}
      >
        <MaterialIcons name="cloud-upload" size={20} color="#fff" />
        <Text style={styles.primaryButtonText}>
          {identityVerification.isPending
            ? "Kaydediliyor…"
            : "Doğrulamayı Kaydet"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { marginHorizontal: 0 }]}
        onPress={handleReset}
      >
        <Text style={styles.secondaryButtonText}>Yeni Tarama</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScreenContainer>
  );
}

function StepInfo({
  number,
  icon,
  title,
  desc,
}: Readonly<{
  number: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  desc: string;
}>) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumberBadge}>
        <Text style={styles.stepNumber}>{number}</Text>
      </View>
      <View style={styles.stepIconBox}>
        <MaterialIcons name={icon} size={22} color={NEUTRAL_ICON_COLOR} />
      </View>
      <View style={styles.stepTextBox}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ResultCard({
  title,
  icon,
  children,
}: Readonly<{
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  children: React.ReactNode;
}>) {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultCardHeader}>
        <View style={styles.resultCardIconBox}>
          <MaterialIcons name={icon} size={16} color={NEUTRAL_ICON_COLOR} />
        </View>
        <Text style={styles.resultCardTitle}>{title}</Text>
      </View>
      <View style={styles.resultCardDivider} />
      <View style={styles.resultCardBody}>{children}</View>
    </View>
  );
}

function ResultRow({
  label,
  value,
}: Readonly<{ label: string; value?: string }>) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue} numberOfLines={1}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: NEUTRAL_ICON_BG,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },

  // Steps
  stepsContainer: {
    width: "100%",
    marginBottom: 32,
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F5",
  },
  stepConnector: {
    width: 2,
    height: 12,
    backgroundColor: "#E5E5EA",
    alignSelf: "center",
    borderRadius: 1,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: {
    color: NEUTRAL_STATUS_TEXT,
    fontSize: 12,
    fontWeight: "700",
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NEUTRAL_ICON_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  stepTextBox: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: "#8E8E93",
    lineHeight: 17,
  },

  // Buttons
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },

  // MRZ Box
  mrzBox: {
    width: "100%",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  mrzLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mrzScroll: {
    maxHeight: 80,
  },
  mrzText: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "monospace",
    lineHeight: 18,
  },

  // NFC Progress
  progressCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 6,
    borderColor: NEUTRAL_ICON_ACCENT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: NEUTRAL_ICON_BG,
    marginBottom: 28,
  },
  progressCircleInner: {
    alignItems: "center",
  },
  progressPercent: {
    fontSize: 38,
    fontWeight: "700",
    color: NEUTRAL_STATUS_TEXT,
  },
  progressStepText: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  progressBarContainer: {
    width: "80%",
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: NEUTRAL_ICON_ACCENT,
    borderRadius: 4,
  },
  nfcMessage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
  },
  nfcHint: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  // Result
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  resultBadgeText: {
    fontSize: 15,
    fontWeight: "700",
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  faceImage: {
    width: 130,
    height: 170,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F5",
    width: "100%",
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  resultCardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: NEUTRAL_ICON_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  resultCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 18,
  },
  resultCardBody: {
    padding: 18,
    gap: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 13,
    color: "#8E8E93",
    flex: 1,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1.5,
    textAlign: "right",
  },
});
