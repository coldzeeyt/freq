import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { FREQ_MAX, FREQ_MIN } from '@/data/stations';
import { colors, fonts } from '@/theme';
import type { Station } from '@/types/models';

interface Props {
  station: Station;
  tuning: boolean;
  humanOnly: boolean;
}

/** The glowing LCD: frequency, station name and an analog tuning scale. */
export function FrequencyDisplay({ station, tuning, humanOnly }: Props) {
  const position = useSharedValue((station.frequency - FREQ_MIN) / (FREQ_MAX - FREQ_MIN));
  const width = useSharedValue(0);

  useEffect(() => {
    position.value = withSpring((station.frequency - FREQ_MIN) / (FREQ_MAX - FREQ_MIN), {
      damping: 18,
      stiffness: 160,
    });
  }, [station.frequency, position]);

  const needleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * width.value }] }));
  const glow = { textShadowColor: station.color, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } };

  return (
    <View style={styles.lcd}>
      <View style={styles.statusRow}>
        <View style={[styles.lamp, { backgroundColor: tuning ? colors.glowDeep : colors.human }]} />
        <Text style={styles.status}>{tuning ? 'TUNING' : 'ON AIR'}</Text>
        {humanOnly && <Text style={[styles.status, styles.humanTag]}>· HUMAN ONLY</Text>}
      </View>
      <View style={styles.readout}>
        <Text style={[styles.freq, { color: station.color }, glow]} accessibilityLabel={`${station.frequency} ${station.name}`}>
          {station.frequency.toFixed(1)}
        </Text>
        <Text style={[styles.name, { color: station.color }, glow]}>
          {station.name.toUpperCase()}
        </Text>
      </View>
      <View style={styles.scale} onLayout={(e) => (width.value = e.nativeEvent.layout.width)}>
        {Array.from({ length: 22 }, (_, i) => (
          <View key={i} style={[styles.tick, i % 5 === 0 && styles.tickMajor]} />
        ))}
        <Animated.View style={[styles.needle, { backgroundColor: station.color, shadowColor: station.color }, needleStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lcd: {
    flex: 1,
    backgroundColor: '#0A0806',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,181,71,0.22)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 9,
    gap: 2,
    overflow: 'hidden',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lamp: { width: 6, height: 6, borderRadius: 3 },
  status: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5 },
  humanTag: { color: colors.human },
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  freq: { fontFamily: fonts.mono, fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  name: { fontFamily: fonts.mono, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  scale: { height: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 },
  tick: { width: 1, height: 4, backgroundColor: 'rgba(255,181,71,0.3)' },
  tickMajor: { height: 8, backgroundColor: 'rgba(255,181,71,0.55)' },
  needle: {
    position: 'absolute',
    left: -1,
    bottom: -2,
    width: 2,
    height: 16,
    borderRadius: 1,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
