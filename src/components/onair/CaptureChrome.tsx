import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clock, useOnAirClock } from '@/state/useOnAirClock';
import { colors, fonts } from '@/theme';

interface Props {
  stage: 'back' | 'front' | 'busy';
  ready: boolean;
  onShutter: () => void;
  onCancel: () => void;
}

export function CaptureChrome({ stage, ready, onShutter, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const { phase, secondsLeft } = useOnAirClock();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={onCancel} hitSlop={10} style={styles.circle} accessibilityLabel="Close camera">
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <View style={[styles.timer, phase === 'live' && styles.timerLive]}>
          <Text style={[styles.timerText, phase === 'live' && styles.timerTextLive]}>
            {phase === 'live' ? `ON AIR ${clock(secondsLeft)}` : phase === 'late' ? 'LATE' : 'NOT LIVE'}
          </Text>
        </View>
        <View style={styles.circle} />
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        {stage === 'front' && (
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={styles.hint}>
            Now you. Smile!
          </Animated.Text>
        )}
        {stage === 'back' && <Text style={styles.hint}>Show what’s in front of you. Then we flip to you.</Text>}
        <Pressable
          onPress={onShutter}
          disabled={!ready || stage !== 'back'}
          style={[styles.shutter, (!ready || stage !== 'back') && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Take photos"
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  timer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(14,13,11,0.6)' },
  timerLive: { backgroundColor: colors.signal },
  timerText: { color: '#fff', fontFamily: fonts.monoMedium, fontSize: 12 },
  timerTextLive: { color: colors.signalInk },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 16 },
  hint: { color: '#fff', fontFamily: fonts.bodyMedium, fontSize: 14, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
});
