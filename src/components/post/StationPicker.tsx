import { Pressable, StyleSheet, Text, View } from 'react-native';
import { POSTABLE_STATIONS } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { colors, fonts, radius } from '@/theme';
import type { StationId } from '@/types/models';

/** Manual override when the tags pick the wrong station. */
export function StationPicker({ value, onChange }: { value: StationId | null; onChange: (id: StationId) => void }) {
  return (
    <View style={styles.grid}>
      {POSTABLE_STATIONS.map((s) => {
        const selected = s.id === value;
        return (
          <Pressable
            key={s.id}
            onPress={() => {
              haptics.detent();
              onChange(s.id);
            }}
            style={[styles.chip, selected && styles.selected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${s.frequency} ${s.name}`}
          >
            <Text style={[styles.freq, selected && { color: colors.signal }]}>{s.frequency.toFixed(1)}</Text>
            <Text style={styles.name}>{s.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  selected: { borderColor: colors.signal, backgroundColor: 'rgba(255,90,31,0.08)' },
  freq: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10 },
  name: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 13 },
});
