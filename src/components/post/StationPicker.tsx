import { Pressable, StyleSheet, Text, View } from 'react-native';
import { POSTABLE_STATIONS } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { colors, fonts } from '@/theme';
import type { Video } from '@/types/models';

type PostableId = Video['stationId'];

export function StationPicker({ value, onChange }: { value: PostableId | null; onChange: (id: PostableId) => void }) {
  return (
    <View style={styles.grid}>
      {POSTABLE_STATIONS.map((s) => {
        const selected = s.id === value;
        return (
          <Pressable
            key={s.id}
            onPress={() => {
              haptics.detent();
              onChange(s.id as PostableId);
            }}
            style={[styles.chip, selected && { borderColor: s.color, backgroundColor: 'rgba(255,255,255,0.07)' }]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${s.frequency} ${s.name}`}
          >
            <Text style={[styles.freq, { color: selected ? s.color : colors.textFaint }]}>{s.frequency.toFixed(1)}</Text>
            <Text style={[styles.name, selected && { color: colors.text }]}>{s.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: '31.5%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  freq: { fontFamily: fonts.mono, fontSize: 11, fontWeight: '700' },
  name: { color: colors.textDim, fontSize: 14, fontWeight: '700' },
});
