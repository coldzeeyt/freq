import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/theme';

export function VaultBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="In the Vault, permanent">
      <Ionicons name="lock-closed" size={9} color={colors.bg} />
      <Text style={styles.text}>VAULT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 16, paddingHorizontal: 5, borderRadius: 3, backgroundColor: colors.text },
  text: { color: colors.bg, fontFamily: fonts.monoMedium, fontSize: 9, letterSpacing: 0.8 },
});
