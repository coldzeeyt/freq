import { Children, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const SPRING = { damping: 26, stiffness: 260, mass: 0.9 };

interface Props {
  page: number;
  onPageChange: (page: number) => void;
  /** Pager position in pages (0 = first). Lets the tab header follow the drag. */
  position: SharedValue<number>;
  /** Touches starting inside this box on the given page are left alone (the dial). */
  blocked?: { page: number; right: number; bottom: number; size: number };
  children: React.ReactNode;
}

/**
 * Swipe left/right between tabs. Only clearly sideways drags turn the page, so vertical
 * swipes still scroll videos and lists, and drags that start on the dial stay with the dial.
 */
export function Pager({ page, onPageChange, position, blocked, children }: Props) {
  const pages = Children.toArray(children);
  const count = pages.length;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const w = size.w;
  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const touch = useSharedValue({ x: 0, y: 0 });
  const current = useSharedValue(page);

  useEffect(() => {
    current.set(page);
    if (w) x.set(withSpring(-page * w, SPRING));
  }, [page, w, current, x]);

  useEffect(() => {
    if (w) x.set(-current.get() * w);
  }, [w, x, current]);

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e, sm) => {
      const t = e.allTouches[0];
      if (!t) return;
      touch.set({ x: t.x, y: t.y });
      if (
        blocked &&
        current.get() === blocked.page &&
        t.x > size.w - blocked.right - blocked.size - 16 &&
        t.y > size.h - blocked.bottom - blocked.size - 16
      ) {
        sm.fail();
      }
    })
    .onTouchesMove((e, sm) => {
      const t = e.allTouches[0];
      if (!t) return;
      const dx = t.x - touch.get().x;
      const dy = t.y - touch.get().y;
      if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.4) sm.activate();
      else if (Math.abs(dy) > 14) sm.fail();
    })
    .onStart(() => {
      startX.set(x.get());
    })
    .onUpdate((e) => {
      let next = startX.get() + e.translationX;
      const min = -(count - 1) * w;
      // Rubber-band past the first and last tab.
      if (next > 0) next = next * 0.3;
      if (next < min) next = min + (next - min) * 0.3;
      x.set(next);
    })
    .onEnd((e) => {
      const from = current.get();
      let target = from;
      if (e.translationX < -w * 0.25 || e.velocityX < -600) target = Math.min(count - 1, from + 1);
      if (e.translationX > w * 0.25 || e.velocityX > 600) target = Math.max(0, from - 1);
      x.set(withSpring(-target * w, SPRING));
      current.set(target);
      if (target !== from) scheduleOnRN(onPageChange, target);
    });

  useAnimatedReaction(
    () => x.get(),
    (v) => position.set(w ? -v / w : 0),
    [w],
  );
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <GestureDetector gesture={pan} touchAction="pan-y">
      <View style={styles.root} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {w > 0 && (
          <Animated.View style={[styles.row, { width: w * count }, rowStyle]}>
            {pages.map((p, i) => (
              <View key={i} style={{ width: w, height: '100%' }}>
                {p}
              </View>
            ))}
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  row: { flex: 1, flexDirection: 'row' },
});
