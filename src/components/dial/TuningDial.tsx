import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '@/theme';

interface Props {
  count: number;
  /** The committed station index. */
  index: number;
  /** The tick to light up (follows the knob while turning). */
  litIndex: number;
  size?: number;
  onTuneStart: () => void;
  /** Fired each time the knob passes a detent while turning. */
  onDetent: (index: number) => void;
  /** Fired when the knob is released and snaps to a station. */
  onTuneEnd: (index: number) => void;
}

const SPRING = { damping: 15, stiffness: 190, mass: 0.7 };

export function TuningDial({ count, index, litIndex, size = 96, onTuneStart, onDetent, onTuneEnd }: Props) {
  const step = 360 / count;
  const rotation = useSharedValue(index * step);
  const lastDetent = useSharedValue(index);
  const prevAngle = useSharedValue(0);
  const active = useSharedValue(false);
  const center = size / 2;

  // Follow external changes (presets) by turning the shortest way round.
  useEffect(() => {
    if (active.get()) return;
    const current = lastDetent.get();
    const currentMod = ((current % count) + count) % count;
    let delta = index - currentMod;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    if (delta === 0) return;
    lastDetent.set(current + delta);
    rotation.set(withSpring((current + delta) * step, SPRING));
  }, [index, count, step, active, lastDetent, rotation]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      active.set(true);
      prevAngle.set((Math.atan2(e.y - center, e.x - center) * 180) / Math.PI);
      scheduleOnRN(onTuneStart);
    })
    .onUpdate((e) => {
      const dx = e.x - center;
      const dy = e.y - center;
      // Angles are meaningless right at the hub; ignore to avoid jumps.
      if (dx * dx + dy * dy < 100) return;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      let delta = angle - prevAngle.get();
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      prevAngle.set(angle);
      rotation.set(rotation.get() + delta);
      const detent = Math.round(rotation.get() / step);
      if (detent !== lastDetent.get()) {
        lastDetent.set(detent);
        scheduleOnRN(onDetent, ((detent % count) + count) % count);
      }
    })
    .onFinalize(() => {
      if (!active.get()) return;
      active.set(false);
      rotation.set(withSpring(lastDetent.get() * step, SPRING));
      scheduleOnRN(onTuneEnd, ((lastDetent.get() % count) + count) % count);
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  const ringR = center - 3;
  const knobSize = size * 0.74;
  const kc = knobSize / 2;

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Tuning dial"
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = (index + (e.nativeEvent.actionName === 'increment' ? 1 : -1) + count) % count;
          onTuneEnd(next);
        }}
      >
        {/* Fixed bezel: one detent mark per station, the current one in signal orange. */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={center} cy={center} r={ringR} fill="none" stroke={colors.line} strokeWidth={1} />
          {Array.from({ length: count }, (_, i) => {
            const a = ((i * step - 90) * Math.PI) / 180;
            const lit = i === litIndex;
            const r1 = ringR - (lit ? 7 : 4);
            return (
              <Line
                key={i}
                x1={center + Math.cos(a) * r1}
                y1={center + Math.sin(a) * r1}
                x2={center + Math.cos(a) * (ringR - 1)}
                y2={center + Math.sin(a) * (ringR - 1)}
                stroke={lit ? colors.signal : colors.lineStrong}
                strokeWidth={lit ? 2.5 : 1}
              />
            );
          })}
        </Svg>

        <Animated.View
          style={[
            styles.knob,
            { width: knobSize, height: knobSize, left: center - kc, top: center - kc, borderRadius: kc },
            knobStyle,
          ]}
        >
          <Svg width={knobSize} height={knobSize}>
            <Defs>
              <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#3B3833" />
                <Stop offset="1" stopColor="#141310" />
              </LinearGradient>
              <LinearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#24221E" />
                <Stop offset="1" stopColor="#2E2B26" />
              </LinearGradient>
            </Defs>
            <Circle cx={kc} cy={kc} r={kc - 0.5} fill="url(#body)" />
            {/* Knurled edge */}
            {Array.from({ length: 48 }, (_, i) => {
              const a = (i * 7.5 * Math.PI) / 180;
              return (
                <Line
                  key={i}
                  x1={kc + Math.cos(a) * (kc - 1)}
                  y1={kc + Math.sin(a) * (kc - 1)}
                  x2={kc + Math.cos(a) * (kc - 5)}
                  y2={kc + Math.sin(a) * (kc - 5)}
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth={1.2}
                />
              );
            })}
            <Circle cx={kc} cy={kc} r={kc * 0.7} fill="url(#cap)" stroke="rgba(0,0,0,0.5)" strokeWidth={1} />
            <Circle cx={kc} cy={kc} r={kc * 0.7 - 1} fill="none" stroke="rgba(237,230,214,0.06)" strokeWidth={1} />
            {/* Indicator line */}
            <Line x1={kc} y1={kc * 0.16} x2={kc} y2={kc * 0.48} stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  knob: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
