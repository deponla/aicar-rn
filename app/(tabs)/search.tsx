import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/constants/theme';

export default function GarageScreen() {
  return (
    <View style={styles.container}>
      <MaterialIcons name="directions-car" size={64} color={tokens.textTertiary} />
      <Text style={styles.title}>Garajım</Text>
      <Text style={styles.subtitle}>Henüz araç eklemediniz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.bgBase },
  title: { fontSize: 20, fontWeight: '700', color: tokens.textPrimary, marginTop: 16 },
  subtitle: { fontSize: 14, color: tokens.textSecondary, marginTop: 8 },
});
