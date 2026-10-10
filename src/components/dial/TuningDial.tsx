import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '@/theme';

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
  /** Fired when the knob settles on a station (release, or shortly after the last click/notch). */
  onTuneEnd: (index: number) => void;
}

const SPRING = { damping: 15, stiffness: 190, mass: 0.7 };
/** Straight-line drags: pixels of travel per station. */
const PX_PER_STATION = 22;
/** Circular drags are geared down so each station needs more travel. */
const ANGULAR_GEAR = 0.6;
/** How long after the last wheel notch / click the station locks in. */
const STEP_SETTLE_MS = 420;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Turn it any way you'd expect:
 * - drag around the edge (circular),
 * - grab the middle and drag up/right (next) or down/left (previous),
 * - click the right half for next, left half for previous,
 * - scroll the wheel / trackpad over it (web).
 */
export function TuningDial({ count, index, litIndex, size = 96, onTuneStart, onDetent, onTuneEnd }: Props) {
  const step = 360 / count;
  const rotation = useSharedValue(index * step);
  const lastDetent = useSharedValue(index);
  const prevAngle = useSharedValue(0);
  const prevTx = useSharedValue(0);
  const prevTy = useSharedValue(0);
  const linear = useSharedValue(false);
  const dragging = useSharedValue(false);
  const center = size / 2;
  const stepTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<View>(null);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);

  // Follow external changes (keyboard, practice resets) by turning the shortest way round.
  useEffect(() => {
    if (dragging.get() || stepTimer.current) return;
    const current = lastDetent.get();
    let delta = index - mod(current, count);
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    if (delta === 0) return;
    lastDetent.set(current + delta);
    rotation.set(withSpring((current + delta) * step, SPRING));
  }, [index, count, step, dragging, lastDetent, rotation]);

  /** One detent at a time, for clicks and wheel notches. Rapid steps form one tuning session. */
  const stepBy = useCallback(
    (dir: number) => {
      if (dragging.get()) return;
      if (!stepTimer.current) {
        setBusy(true);
        onTuneStart();
      }
      clearTimeout(stepTimer.current);
      const d = lastDetent.get() + dir;
      lastDetent.set(d);
      rotation.set(withSpring(d * step, SPRING));
      onDetent(mod(d, count));
      stepTimer.current = setTimeout(() => {
        stepTimer.current = undefined;
        setBusy(false);
        onTuneEnd(mod(lastDetent.get(), count));
      }, STEP_SETTLE_MS);
    },
    [count, step, dragging, lastDetent, rotation, onTuneStart, onDetent, onTuneEnd],
  );

  useEffect(() => () => clearTimeout(stepTimer.current), []);

  // Mouse wheel / trackpad over the dial (web). Keeps the page from scrolling.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = root.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    let acc = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      acc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const now = Date.now();
      // Trackpads send many small deltas; a mouse sends ~100 per notch.
      if (Math.abs(acc) >= 40 && now - last > 70) {
        stepBy(acc > 0 ? 1 : -1);
        acc = 0;
        last = now;
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [stepBy]);

  const pan = Gesture.Pan()
    .minDistance(3)
    .hitSlop(14)
    .onStart((e) => {
      const sx = e.x - e.translationX - center;
      const sy = e.y - e.translationY - center;
      // Grabbed near the middle: treat it as a slider. Near the edge: turn it.
      linear.set(sx * sx + sy * sy < (size * 0.3) ** 2);
      prevAngle.set((Math.atan2(e.y - center, e.x - center) * 180) / Math.PI);
      prevTx.set(e.translationX);
      prevTy.set(e.translationY);
      dragging.set(true);
      scheduleOnRN(onTuneStart);
    })
    .onUpdate((e) => {
      let delta = 0;
      if (linear.get()) {
        delta = (e.translationX - prevTx.get() - (e.translationY - prevTy.get())) * (step / PX_PER_STATION);
      } else {
        const dx = e.x - center;
        const dy = e.y - center;
        if (dx * dx + dy * dy >= 100) {
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          delta = angle - prevAngle.get();
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          prevAngle.set(angle);
          delta *= ANGULAR_GEAR;
        }
      }
      prevTx.set(e.translationX);
      prevTy.set(e.translationY);
      rotation.set(rotation.get() + delta);
      const detent = Math.round(rotation.get() / step);
      if (detent !== lastDetent.get()) {
        lastDetent.set(detent);
        scheduleOnRN(onDetent, mod(detent, count));
      }
    })
    .onFinalize(() => {
      if (!dragging.get()) return;
      dragging.set(false);
      rotation.set(withSpring(lastDetent.get() * step, SPRING));
      scheduleOnRN(onTuneEnd, mod(lastDetent.get(), count));
    });

  const tap = Gesture.Tap()
    .maxDuration(400)
    .hitSlop(14)
    // Gesture callbacks run on tap, not during render; stepBy only reads its timer ref then.
    // eslint-disable-next-line react-hooks/refs
    .onEnd((e, ok) => {
      if (ok) scheduleOnRN(stepBy, e.x < center ? -1 : 1);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  const ringR = center - 3;
  const knobSize = size * 0.74;
  const kc = knobSize / 2;

  return (
    <GestureDetector gesture={gesture}>
      <View
        ref={root}
        style={[{ width: size, height: size }, Platform.OS === 'web' && (styles.grab as object)]}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Tuning dial"
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          stepBy(e.nativeEvent.actionName === 'increment' ? 1 : -1);
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
        {Platform.OS === 'web' && hover && !busy && (
          <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>scroll · drag · click a side</Text>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  grab: { cursor: 'grab', userSelect: 'none', touchAction: 'none' } as object,
  hint: {
    position: 'absolute',
    right: 0,
    bottom: '100%',
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(14,13,11,0.78)',
  },
  hintText: { color: colors.text, fontFamily: fonts.mono, fontSize: 11, whiteSpace: 'nowrap' } as object,
  knob: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
