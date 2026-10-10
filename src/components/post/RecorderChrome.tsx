import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { RecordButton } from './RecordButton';
import { formatClock, MAX_SECONDS } from './recorderTypes';

interface Props {
  recording: boolean;
  elapsed: number;
  ready: boolean;
  onToggle: () => void;
  onFlip?: () => void;
  onCancel: () => void;
}

/** Shared controls drawn over the native and web camera previews. */
export function RecorderChrome({ recording, elapsed, ready, onToggle, onFlip, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={onCancel} hitSlop={10} style={styles.circle} accessibilityLabel="Close camera" disabled={recording}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <View style={[styles.timer, recording && styles.timerLive]}>
          {recording && <View style={styles.dot} />}
          <Text style={styles.timerText}>
            {formatClock(elapsed)} / {formatClock(MAX_SECONDS)}
          </Text>
        </View>
        <View style={styles.circle}>
          {onFlip && !recording && (
            <Pressable onPress={onFlip} hitSlop={10} accessibilityLabel="Flip camera">
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.humanNote}>
          <Ionicons name="finger-print" size={14} color={colors.human} />
          <Text style={styles.humanText}>Recorded in Freq = verified Human</Text>
        </View>
        <RecordButton recording={recording} disabled={!ready} onPress={onToggle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' },
  timerLive: { backgroundColor: 'rgba(255,69,58,0.85)' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  timerText: { color: '#fff', fontWeight: '700', fontVariant: ['tabular-nums'] },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 18 },
  humanNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
  humanText: { color: colors.human, fontSize: 12, fontWeight: '700' },
});
