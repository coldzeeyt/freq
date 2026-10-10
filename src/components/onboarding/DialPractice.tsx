import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { BandDisplay } from '@/components/dial/BandDisplay';
import { StaticOverlay } from '@/components/dial/StaticOverlay';
import { TuningDial } from '@/components/dial/TuningDial';
import { getStation, STATIONS, stationIndex } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { useTuner } from '@/state/useTuner';
import { colors, fonts, radius } from '@/theme';
import type { StationId } from '@/types/models';

interface Props {
  targets: StationId[];
  onComplete?: () => void;
  dialSize?: number;
}

/** A little game: spin the dial onto each target station. */
export function DialPractice({ targets, onComplete, dialSize = 168 }: Props) {
  const [stationId, setStationId] = useState<StationId>('all');
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const tuner = useTuner(stationId, setStationId);
  const displayed = tuner.previewIndex !== null ? STATIONS[tuner.previewIndex] : getStation(stationId);
  const target = targets[step];
  const done = step >= targets.length;
  // Restart only when the targets actually change (callers may pass a fresh array each render).
  const targetsKey = targets.join(',');
  const [prevKey, setPrevKey] = useState(targetsKey);
  if (prevKey !== targetsKey) {
    setPrevKey(targetsKey);
    setStep(0);
  }

  useEffect(() => {
    if (!target || stationId !== target) return;
    haptics.success();
    const id = setTimeout(() => {
      setStep((s) => s + 1);
      if (step + 1 >= targets.length) onComplete?.();
    }, 650);
    return () => clearTimeout(id);
  }, [stationId, target, step, targets.length, onComplete]);

  // A nudge that wobbles until the first touch.
  const wobble = useSharedValue(0);
  useEffect(() => {
    wobble.set(withRepeat(withSequence(withTiming(-14, { duration: 500 }), withTiming(14, { duration: 700 }), withTiming(0, { duration: 500 })), -1));
  }, [wobble]);
  const hintStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.get()}deg` }] }));

  const hit = !!target && stationId === target && tuner.previewIndex === null;

  return (
    <View style={styles.card}>
      <View style={styles.glass}>
        <BandDisplay station={displayed} tuning={tuner.tuning} />
        <StaticOverlay level={tuner.staticLevel} visible={tuner.staticVisible} />
      </View>

      <View style={styles.goalRow}>
        {done ? (
          <Animated.View key="done" entering={ZoomIn.springify()} style={styles.goal}>
            <Ionicons name="checkmark-circle" size={18} color={colors.signal} />
            <Text style={styles.goalText}>Tuned in. You’ve got it.</Text>
          </Animated.View>
        ) : (
          <Animated.View key={target} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(120)} style={styles.goal}>
            <Text style={styles.goalStep}>
              {step + 1}/{targets.length}
            </Text>
            <Text style={styles.goalText}>
              Tune to <Text style={styles.goalStation}>{getStation(target).frequency.toFixed(1)} {getStation(target).name}</Text>
            </Text>
            {hit && (
              <Animated.View entering={ZoomIn}>
                <Ionicons name="checkmark" size={18} color={colors.signal} />
              </Animated.View>
            )}
          </Animated.View>
        )}
      </View>

      <View style={styles.dialArea}>
        <TuningDial
          count={STATIONS.length}
          index={stationIndex(stationId)}
          litIndex={tuner.previewIndex ?? stationIndex(stationId)}
          size={dialSize}
          onTuneStart={() => {
            setTouched(true);
            tuner.onTuneStart();
          }}
          onDetent={tuner.onDetent}
          onTuneEnd={tuner.onTuneEnd}
        />
        {!touched && (
          <Animated.View entering={FadeIn.delay(600)} exiting={FadeOut} style={styles.hint} pointerEvents="none">
            <Animated.View style={hintStyle}>
              <Ionicons name="sync-outline" size={16} color={colors.textDim} />
            </Animated.View>
            <Text style={styles.hintText}>drag around the knob</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  glass: {
    padding: 14,
    paddingBottom: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
  },
  goalRow: { height: 26, justifyContent: 'center' },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalStep: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  goalText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 15 },
  goalStation: { color: colors.signal, fontFamily: fonts.bodyBold },
  dialArea: { alignItems: 'center', gap: 10 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 11 },
});
