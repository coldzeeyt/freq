import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

const FRAMES = [
  require('../../../assets/noise/noise0.png'),
  require('../../../assets/noise/noise1.png'),
  require('../../../assets/noise/noise2.png'),
  require('../../../assets/noise/noise3.png'),
];

/** Flickering TV/radio static laid over the feed while tuning. */
export function StaticOverlay({ level, visible }: { level: SharedValue<number>; visible: boolean }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setFrame((f) => (f + 1 + Math.floor(Math.random() * 2)) % FRAMES.length), 55);
    return () => clearInterval(id);
  }, [visible]);

  const style = useAnimatedStyle(() => ({ opacity: level.get() }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.wrap, style]} pointerEvents="none">
      {visible && <Image source={FRAMES[frame]} style={styles.noise} resizeMode="repeat" />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#111' },
  noise: { width: '100%', height: '100%', opacity: 0.9 },
});
