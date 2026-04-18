import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/constants/theme';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <MaterialIcons name="camera-alt" size={80} color={tokens.primary} />
      <Text style={styles.title}>Aracını Tara</Text>
      <Text style={styles.subtitle}>Kameranı ikaz lambasına veya arıza koduna tut</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Taramayı Başlat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bgBase, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: tokens.textPrimary, marginTop: 24, marginBottom: 8 },
  subtitle: { fontSize: 15, color: tokens.textSecondary, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: tokens.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
