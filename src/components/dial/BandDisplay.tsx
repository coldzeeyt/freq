import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { FREQ_MAX, FREQ_MIN } from '@/data/stations';
import { colors, fonts } from '@/theme';
import type { Station } from '@/types/models';

interface Props {
  station: Station;
  tuning: boolean;
}

const MAJORS = [88, 92, 96, 100, 104, 108];
const pos = (f: number) => (f - FREQ_MIN) / (FREQ_MAX - FREQ_MIN);

/** The radio's glass: readout on top, a printed FM band and a needle below. */
export function BandDisplay({ station, tuning }: Props) {
  const needle = useSharedValue(pos(station.frequency));
  const width = useSharedValue(0);

  useEffect(() => {
    needle.set(withSpring(pos(station.frequency), { damping: 20, stiffness: 170, mass: 0.8 }));
  }, [station.frequency, needle]);

  const needleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: needle.get() * width.get() }] }));

  return (
    <View style={styles.wrap} accessibilityLabel={`Tuned to ${station.frequency} ${station.name}`}>
      <View style={styles.readout}>
        <View style={styles.digits}>
          <Animated.Text
            key={station.id}
            entering={FadeInDown.duration(160)}
            exiting={FadeOutUp.duration(120)}
            style={styles.freq}
          >
            {station.frequency.toFixed(1)}
          </Animated.Text>
        </View>
        <Text style={styles.unit}>FM</Text>
        <Animated.Text key={`n-${station.id}`} entering={FadeInDown.duration(160).delay(30)} style={styles.name}>
          {station.name}
        </Animated.Text>
        <View style={styles.spacer} />
        <Text style={[styles.status, tuning && styles.statusTuning]}>{tuning ? 'tuning' : 'on air'}</Text>
      </View>

      <View style={styles.band} onLayout={(e) => width.set(e.nativeEvent.layout.width)}>
        {Array.from({ length: 41 }, (_, i) => {
          const f = 88 + i * 0.5;
          const major = MAJORS.includes(f);
          return (
            <View
              key={i}
              style={[styles.tick, { left: `${pos(f) * 100}%` }, major ? styles.tickMajor : i % 2 === 0 && styles.tickMid]}
            />
          );
        })}
        {MAJORS.map((f) => (
          <Text key={f} style={[styles.bandNum, { left: `${pos(f) * 100}%` }]}>
            {f}
          </Text>
        ))}
        <Animated.View style={[styles.needle, needleStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  digits: { height: 34, justifyContent: 'flex-end', overflow: 'hidden' },
  freq: { color: colors.text, fontFamily: fonts.narrowBold, fontSize: 32, lineHeight: 34, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  unit: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10 },
  name: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 15 },
  spacer: { flex: 1 },
  status: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  statusTuning: { color: colors.signal },
  band: { height: 22, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
  tick: { position: 'absolute', top: 0, width: StyleSheet.hairlineWidth, height: 3, backgroundColor: colors.textFaint },
  tickMid: { height: 5 },
  tickMajor: { height: 8, width: 1, backgroundColor: colors.textDim },
  bandNum: {
    position: 'absolute',
    top: 9,
    width: 30,
    marginLeft: -15,
    textAlign: 'center',
    color: colors.textFaint,
    fontFamily: fonts.mono,
    fontSize: 9,
  },
  needle: { position: 'absolute', top: -8, left: -1, width: 2, height: 22, backgroundColor: colors.signal },
});
