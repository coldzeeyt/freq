import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

export function HumanBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Human-made video">
      <Ionicons name="finger-print" size={11} color={colors.human} />
      <Text style={styles.text}>HUMAN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,30,18,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.55)',
  },
  text: { color: colors.human, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
