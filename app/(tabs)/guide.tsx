import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/constants/theme';
import ScreenContainer from '@/components/ScreenContainer';
import { useAnalyzeObd } from '@/query-hooks/useAiAnalysis';
import {
  type AiAnalysisPayload,
  type AiWarning,
} from '@/types/ai';

// ─── Types ────────────────────────────────────────────────────────────────────

type WarningLightEntry = {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  severity: 'critical' | 'warning' | 'info';
  severityLabel: string;
  description: string;
  action: string;
};

type MaintenanceEntry = {
  id: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  interval: string;
};

// ─── Static Data ──────────────────────────────────────────────────────────────

const WARNING_LIGHTS: WarningLightEntry[] = [
  {
    id: 'check-engine',
    name: 'Motor Arizasi (Check Engine)',
    icon: 'warning',
    severity: 'critical',
    severityLabel: 'Kritik',
    description: 'Motor kontrol birimi bir sorun tespit etti. Emisyon sistemi, ates zamanlama veya yakıt sistemiyle ilgili olabilir.',
    action: 'En kısa sürede yetkili servise gidin. Sürekli yanıyorsa hemen durdurun.',
  },
  {
    id: 'oil-pressure',
    name: 'Yag Basinci Uyarisi',
    icon: 'oil-barrel',
    severity: 'critical',
    severityLabel: 'Kritik',
    description: 'Motor yağ basıncı tehlikeli seviyede düşük. Motor hasar görebilir.',
    action: 'Hemen güvenli bir yere çekin, motoru kapatın. Yağ seviyesini kontrol edin.',
  },
  {
    id: 'battery',
    name: 'Sarj/Aku Uyarisi',
    icon: 'battery-alert',
    severity: 'warning',
    severityLabel: 'Uyari',
    description: 'Şarj sistemi veya akü arızası. Alternatör çalışmıyor olabilir.',
    action: 'Gereksiz elektrikli cihazları kapatın, en yakın servise gidin.',
  },
  {
    id: 'coolant',
    name: 'Sogutma Sistemi',
    icon: 'thermostat',
    severity: 'critical',
    severityLabel: 'Kritik',
    description: 'Motor aşırı ısınıyor. Soğutma suyu seviyesi düşük veya radyatör arızalı olabilir.',
    action: 'Hemen durun, motoru kapatın. Soğumayı bekleyin, soğutma suyunu kontrol edin.',
  },
  {
    id: 'brake',
    name: 'Fren Sistemi',
    icon: 'disc-full',
    severity: 'warning',
    severityLabel: 'Uyari',
    description: 'Fren sistemi uyarısı. Fren hidroliği seviyesi düşük veya el freni açık olabilir.',
    action: 'El freni kapalıysa servise gidin. Fren hissi bozuksa hemen durdurun.',
  },
  {
    id: 'abs',
    name: 'ABS Uyarisi',
    icon: 'sync-problem',
    severity: 'warning',
    severityLabel: 'Uyari',
    description: 'ABS (Kilitlenme Önleyici Fren) sistemi arızalı. Normal frenler çalışır ama ABS devreye girmez.',
    action: 'Acil değil ama en kısa sürede servise gidin, sert frenlerde dikkatli olun.',
  },
  {
    id: 'airbag',
    name: 'Hava Yastigi (SRS)',
    icon: 'airline-seat-recline-extra',
    severity: 'warning',
    severityLabel: 'Uyari',
    description: 'Hava yastığı sistemi arızalı. Kaza durumunda hava yastıkları açılmayabilir.',
    action: 'Servise gidin. Koltuk konumunu veya güvenlik kemerini kontrol edin.',
  },
  {
    id: 'fuel',
    name: 'Yakıt Seviyesi',
    icon: 'local-gas-station',
    severity: 'warning',
    severityLabel: 'Uyari',
    description: 'Yakıt deposu düşük seviyede, genellikle 5-10 litre kaldı.',
    action: 'En yakın istasyondan yakıt alın.',
  },
  {
    id: 'tpms',
    name: 'Lastik Basinci (TPMS)',
    icon: 'tire-repair',
    severity: 'warning',
    severityLabel: 'Uyari',
    description: 'En az bir lastik önerilen basıncın altında. Lastik defolu veya hava kaybediyor olabilir.',
    action: 'Lastikleri görsel kontrol edin, en yakın istasyonda basınçları kontrol edin.',
  },
  {
    id: 'service',
    name: 'Servis Zamani',
    icon: 'build',
    severity: 'info',
    severityLabel: 'Bilgi',
    description: 'Periyodik bakım zamanı geldi. Yağ değişimi veya genel bakım gerekiyor.',
    action: 'Servis randevusu alın. Acil değil ama geciktirmeyin.',
  },
];

const MAINTENANCE_ITEMS: MaintenanceEntry[] = [
  { id: 'oil', icon: 'oil-barrel', label: 'Motor Yagi', interval: 'Her 10.000 km' },
  { id: 'air-filter', icon: 'air', label: 'Hava Filtresi', interval: 'Her 20.000 km' },
  { id: 'brake-pads', icon: 'disc-full', label: 'Fren Balatalari', interval: 'Her 30.000-50.000 km' },
  { id: 'timing-belt', icon: 'settings', label: 'Triger Kayisi', interval: 'Her 60.000-100.000 km' },
  { id: 'battery', icon: 'battery-charging-full', label: 'Aku', interval: 'Her 3-5 yilda' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityStyle(severity: WarningLightEntry['severity']) {
  switch (severity) {
    case 'critical':
      return { bg: tokens.dangerBg, text: tokens.dangerText, border: '#FCA5A5' };
    case 'warning':
      return { bg: tokens.warningBg, text: tokens.warningText, border: '#FCD34D' };
    default:
      return { bg: tokens.infoBg, text: tokens.infoText, border: '#93C5FD' };
  }
}

function getUrgencyStyle(urgency?: AiAnalysisPayload['urgency']) {
  switch (urgency) {
    case 'critical':
      return { bg: tokens.dangerBg, text: tokens.dangerText, label: 'Kritik' };
    case 'warning':
      return { bg: tokens.warningBg, text: tokens.warningText, label: 'Uyari' };
    default:
      return { bg: tokens.successBg, text: tokens.successText, label: 'Bilgi' };
  }
}

function getWarningSeverityStyle(severity: AiWarning['severity']) {
  switch (severity) {
    case 'critical':
      return { bg: tokens.dangerBg, text: tokens.dangerText };
    case 'high':
      return { bg: tokens.dangerBg, text: tokens.dangerText };
    case 'medium':
      return { bg: tokens.warningBg, text: tokens.warningText };
    default:
      return { bg: tokens.infoBg, text: tokens.infoText };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = memo(function SectionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
});


const WarningLightCard = memo(function WarningLightCard({
  entry,
}: {
  entry: WarningLightEntry;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityStyle = useMemo(
    () => getSeverityStyle(entry.severity),
    [entry.severity],
  );
  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.wlCard, { borderColor: severityStyle.border }]}
      onPress={toggleExpanded}
    >
      <View style={styles.wlCardHeader}>
        <View style={[styles.wlIconBox, { backgroundColor: severityStyle.bg }]}> 
          <MaterialIcons name={entry.icon} size={22} color={severityStyle.text} />
        </View>
        <View style={styles.wlCardBody}>
          <Text style={styles.wlCardName}>{entry.name}</Text>
          <View style={[styles.badge, { backgroundColor: severityStyle.bg }]}> 
            <Text style={[styles.badgeText, { color: severityStyle.text }]}>
              {entry.severityLabel}
            </Text>
          </View>
        </View>
        <MaterialIcons
          name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={22}
          color={tokens.textTertiary}
        />
      </View>

      {expanded ? (
        <View style={styles.wlExpanded}>
          <Text style={styles.wlDescription}>{entry.description}</Text>
          <View style={styles.wlActionBox}>
            <MaterialIcons name="check-circle" size={16} color={tokens.success} />
            <Text style={styles.wlActionText}>{entry.action}</Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
});


const MaintenanceCard = memo(function MaintenanceCard({
  entry,
}: {
  entry: MaintenanceEntry;
}) {
  return (
    <View style={styles.maintCard}>
      <View style={styles.maintIconBox}>
        <MaterialIcons name={entry.icon} size={20} color={tokens.primary} />
      </View>
      <View style={styles.maintBody}>
        <Text style={styles.maintLabel}>{entry.label}</Text>
        <Text style={styles.maintInterval}>{entry.interval}</Text>
      </View>
    </View>
  );
});


// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GuideScreen() {
  const [obdCode, setObdCode] = useState('');
  const [obdResult, setObdResult] = useState<AiAnalysisPayload | null>(null);
  const analyzeObd = useAnalyzeObd();

const handleObdSearch = useCallback(async () => {
  const code = obdCode.trim().toUpperCase();
  if (!code) {
    Alert.alert('Hata', 'Lutfen bir OBD kodu girin.');
    return;
  }

  setObdResult(null);

  try {
    const response = await analyzeObd.mutateAsync({
      code,
      prompt: `OBD hata kodu analizi`,
    });

    if (response.result.aiResponse) {
      setObdResult(response.result.aiResponse);
    } else {
      Alert.alert('Sonuc', 'Analiz tamamlandi ancak yanit bos.');
    }
  } catch (error) {
    Alert.alert('Hata', error instanceof Error ? error.message : 'Bilinmeyen bir hata olustu.');
  }
}, [analyzeObd, obdCode]);

const submitObdSearch = useCallback(() => {
  void handleObdSearch();
}, [handleObdSearch]);

const urgencyStyle = useMemo(
  () => getUrgencyStyle(obdResult?.urgency),
  [obdResult?.urgency],
);


  return (
    <ScreenContainer title="Rehber">
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── OBD Sorgu ── */}
        <SectionHeader title="OBD Kodu Sorgula" />

        <View style={styles.obdCard}>
          <View style={styles.obdIntro}>
            <MaterialIcons name="search" size={28} color={tokens.primary} />
            <View style={styles.obdIntroText}>
              <Text style={styles.obdTitle}>Ariza Kodu Ara</Text>
              <Text style={styles.obdSubtitle}>Arac bilgisayarindan gelen kodu girerek AI analizi yapın.</Text>
            </View>
          </View>

          <View style={styles.obdInputRow}>
            <TextInput
              style={styles.obdInput}
              placeholder="P0301, P0420..."
              placeholderTextColor={tokens.textPlaceholder}
              value={obdCode}
              onChangeText={setObdCode}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={submitObdSearch}
            />
            <TouchableOpacity
              style={[styles.obdButton, analyzeObd.isPending && styles.obdButtonDisabled]}
              disabled={analyzeObd.isPending}
              onPress={submitObdSearch}
              activeOpacity={0.85}
            >
              {analyzeObd.isPending ? (
                <ActivityIndicator color={tokens.textInverse} size="small" />
              ) : (
                <Text style={styles.obdButtonText}>Sorgula</Text>
              )}
            </TouchableOpacity>
          </View>

          {obdResult ? (
            <View style={styles.obdResultCard}>
              <View style={styles.obdResultHeader}>
                <Text style={styles.obdResultTitle}>{obdResult.title}</Text>
                <View style={[styles.badge, { backgroundColor: urgencyStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: urgencyStyle.text }]}>
                    {urgencyStyle.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.obdResultSummary}>{obdResult.summary}</Text>

              <Text style={styles.subLabel}>Aciklama</Text>
              <Text style={styles.obdResultBody}>{obdResult.description}</Text>

              <Text style={styles.subLabel}>Oneri</Text>
              <Text style={styles.obdResultBody}>{obdResult.recommendation}</Text>

              {obdResult.warnings.length > 0 ? (
                <View style={styles.warnList}>
                  <Text style={styles.subLabel}>Uyarilar</Text>
                  {obdResult.warnings.map((w, i) => {
                    const ws = getWarningSeverityStyle(w.severity);
                    return (
                      <View
                        key={`${w.name}-${i}`}
                        style={[styles.warnItem, { backgroundColor: ws.bg }]}
                      >
                        <Text style={[styles.warnItemTitle, { color: ws.text }]}>{w.name}</Text>
                        <Text style={styles.warnItemDesc}>{w.description}</Text>
                        <Text style={styles.warnItemRec}>{w.recommendation}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Ikaz Lambalari ── */}
        <SectionHeader title="Ikaz Lambalari Rehberi" />

        <View style={styles.wlList}>
          {WARNING_LIGHTS.map((entry) => (
            <WarningLightCard key={entry.id} entry={entry} />
          ))}
        </View>

        {/* ── Bakim Hatirlatıcıları ── */}
        <SectionHeader title="Bakim Hatirlatıcıları" />

        <View style={styles.maintList}>
          {MAINTENANCE_ITEMS.map((entry) => (
            <MaintenanceCard key={entry.id} entry={entry} />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },

  // Section header
  sectionHeader: {
    marginTop: 8,
    marginBottom: 2,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.textPrimary,
  },

  // OBD
  obdCard: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
    gap: 16,
  },
  obdIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  obdIntroText: {
    flex: 1,
  },
  obdTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.textPrimary,
  },
  obdSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: tokens.textSecondary,
    marginTop: 2,
  },
  obdInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  obdInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tokens.borderDefault,
    backgroundColor: tokens.bgSubtle,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: tokens.textPrimary,
  },
  obdButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: tokens.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obdButtonDisabled: {
    opacity: 0.7,
  },
  obdButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.textInverse,
  },
  obdResultCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: tokens.bgSubtle,
    borderWidth: 1,
    borderColor: tokens.borderSubtle,
    gap: 4,
  },
  obdResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  obdResultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.textPrimary,
    flex: 1,
  },
  obdResultSummary: {
    fontSize: 15,
    lineHeight: 22,
    color: tokens.textPrimary,
    marginBottom: 4,
  },
  obdResultBody: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  subLabel: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.textTertiary,
  },
  warnList: {
    gap: 8,
    marginTop: 4,
  },
  warnItem: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  warnItemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  warnItemDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: tokens.textPrimary,
  },
  warnItemRec: {
    fontSize: 12,
    lineHeight: 17,
    color: tokens.textSecondary,
  },

  // Badge
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Warning Lights
  wlList: {
    gap: 10,
  },
  wlCard: {
    backgroundColor: tokens.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  wlCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wlIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wlCardBody: {
    flex: 1,
    gap: 4,
  },
  wlCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.textPrimary,
  },
  wlExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.borderSubtle,
    gap: 10,
  },
  wlDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: tokens.textSecondary,
  },
  wlActionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: tokens.successBg,
    borderRadius: 10,
    padding: 10,
  },
  wlActionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: tokens.successText,
    fontWeight: '500',
  },

  // Maintenance
  maintList: {
    gap: 10,
  },
  maintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: tokens.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.borderDefault,
    padding: 14,
  },
  maintIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: tokens.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintBody: {
    flex: 1,
  },
  maintLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.textPrimary,
  },
  maintInterval: {
    fontSize: 13,
    color: tokens.textSecondary,
    marginTop: 2,
  },

  bottomSpacer: {
    height: 20,
  },
});
