import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getStation } from '@/data/stations';
import { colors, fonts } from '@/theme';
import type { PresetSlots, StationId } from '@/types/models';

interface Props {
  presets: PresetSlots;
  current: StationId;
  onSelect: (id: StationId) => void;
  /** Long-press, like holding a car radio preset to store the station. */
  onStore: (slot: number) => void;
  onEmptyPress: (slot: number) => void;
}

export function PresetBar({ presets, current, onSelect, onStore, onEmptyPress }: Props) {
  return (
    <View style={styles.row}>
      {presets.map((id, slot) => {
        const station = id ? getStation(id) : null;
        const active = id === current;
        return (
          <Pressable
            key={slot}
            onPress={() => (id ? onSelect(id) : onEmptyPress(slot))}
            onLongPress={() => onStore(slot)}
            delayLongPress={450}
            style={({ pressed }) => [
              styles.button,
              active && station && { borderColor: station.color, backgroundColor: 'rgba(255,181,71,0.08)' },
              pressed && styles.pressed,
            ]}
            accessibilityLabel={
              station ? `Preset ${slot + 1}: ${station.frequency} ${station.name}. Hold to replace.` : `Preset ${slot + 1} empty. Hold to save.`
            }
          >
            <Text style={styles.slot}>{slot + 1}</Text>
            <Text
              style={[styles.value, station ? { color: active ? station.color : colors.text } : styles.empty]}
              numberOfLines={1}
            >
              {station ? station.frequency.toFixed(1) : '—'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  button: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.94 }], backgroundColor: 'rgba(255,255,255,0.14)' },
  slot: { color: colors.textFaint, fontSize: 8, fontWeight: '800', fontFamily: fonts.mono },
  value: { fontSize: 11, fontWeight: '700', fontFamily: fonts.mono },
  empty: { color: colors.textFaint },
});
