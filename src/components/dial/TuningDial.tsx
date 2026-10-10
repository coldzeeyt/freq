import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '@/theme';

interface Props {
  count: number;
  /** The committed station index. */
  index: number;
  /** The tick to light up (follows the knob while turning). */
  litIndex: number;
  size?: number;
  accent: string;
  onTuneStart: () => void;
  /** Fired each time the knob passes a detent while turning. */
  onDetent: (index: number) => void;
  /** Fired when the knob is released and snaps to a station. */
  onTuneEnd: (index: number) => void;
}

const SPRING = { damping: 15, stiffness: 190, mass: 0.7 };

export function TuningDial({ count, index, litIndex, size = 116, accent, onTuneStart, onDetent, onTuneEnd }: Props) {
  const step = 360 / count;
  const rotation = useSharedValue(index * step);
  const lastDetent = useSharedValue(index);
  const prevAngle = useSharedValue(0);
  const active = useSharedValue(false);
  const center = size / 2;

  // Follow external changes (presets) by turning the shortest way round.
  useEffect(() => {
    if (active.value) return;
    const current = lastDetent.value;
    const currentMod = ((current % count) + count) % count;
    let delta = index - currentMod;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    if (delta === 0) return;
    lastDetent.value = current + delta;
    rotation.value = withSpring((current + delta) * step, SPRING);
  }, [index, count, step, active, lastDetent, rotation]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      active.value = true;
      prevAngle.value = (Math.atan2(e.y - center, e.x - center) * 180) / Math.PI;
      scheduleOnRN(onTuneStart);
    })
    .onUpdate((e) => {
      const dx = e.x - center;
      const dy = e.y - center;
      // Angles are meaningless right at the hub; ignore to avoid jumps.
      if (dx * dx + dy * dy < 100) return;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      let delta = angle - prevAngle.value;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      prevAngle.value = angle;
      rotation.value += delta;
      const detent = Math.round(rotation.value / step);
      if (detent !== lastDetent.value) {
        lastDetent.value = detent;
        scheduleOnRN(onDetent, ((detent % count) + count) % count);
      }
    })
    .onFinalize(() => {
      if (!active.value) return;
      active.value = false;
      rotation.value = withSpring(lastDetent.value * step, SPRING);
      scheduleOnRN(onTuneEnd, ((lastDetent.value % count) + count) % count);
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

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
        {/* Fixed detent ring: one tick per station, the current one lit. */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {Array.from({ length: count }, (_, i) => {
            const a = ((i * step - 90) * Math.PI) / 180;
            const lit = i === litIndex;
            const r1 = ringR - (lit ? 9 : 6);
            return (
              <Line
                key={i}
                x1={center + Math.cos(a) * r1}
                y1={center + Math.sin(a) * r1}
                x2={center + Math.cos(a) * ringR}
                y2={center + Math.sin(a) * ringR}
                stroke={lit ? accent : 'rgba(255,255,255,0.28)'}
                strokeWidth={lit ? 3 : 1.5}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>

        <View style={[styles.glow, { shadowColor: accent }]} pointerEvents="none" />

        <Animated.View
          style={[
            styles.knob,
            { width: knobSize, height: knobSize, left: center - kc, top: center - kc, borderRadius: kc },
            knobStyle,
          ]}
        >
          <Svg width={knobSize} height={knobSize}>
            <Defs>
              <RadialGradient id="body" cx="40%" cy="35%" r="75%">
                <Stop offset="0" stopColor="#3A3A44" />
                <Stop offset="0.6" stopColor="#1C1C22" />
                <Stop offset="1" stopColor="#0C0C10" />
              </RadialGradient>
              <RadialGradient id="cap" cx="45%" cy="40%" r="70%">
                <Stop offset="0" stopColor="#2E2E36" />
                <Stop offset="1" stopColor="#141418" />
              </RadialGradient>
            </Defs>
            <Circle cx={kc} cy={kc} r={kc - 1} fill="url(#body)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            {/* Knurled grip */}
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i * 10 * Math.PI) / 180;
              return (
                <Line
                  key={i}
                  x1={kc + Math.cos(a) * (kc - 2)}
                  y1={kc + Math.sin(a) * (kc - 2)}
                  x2={kc + Math.cos(a) * (kc - 8)}
                  y2={kc + Math.sin(a) * (kc - 8)}
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth={1.4}
                />
              );
            })}
            <Circle cx={kc} cy={kc} r={kc * 0.62} fill="url(#cap)" stroke="rgba(0,0,0,0.6)" strokeWidth={1} />
            {/* Pointer */}
            <Line x1={kc} y1={kc * 0.22} x2={kc} y2={kc * 0.6} stroke={accent} strokeWidth={4} strokeLinecap="round" />
            <Circle cx={kc} cy={kc * 0.22} r={3.2} fill="#fff" opacity={0.9} />
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
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  glow: {
    position: 'absolute',
    left: '20%',
    top: '20%',
    width: '60%',
    height: '60%',
    borderRadius: 999,
    backgroundColor: colors.bg,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
});
