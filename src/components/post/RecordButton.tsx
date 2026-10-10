import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme';

export function RecordButton({ recording, disabled, onPress }: { recording: boolean; disabled?: boolean; onPress: () => void }) {
  const inner = useAnimatedStyle(() => ({
    width: withSpring(recording ? 30 : 62),
    height: withSpring(recording ? 30 : 62),
    borderRadius: withSpring(recording ? 8 : 31),
  }));
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.ring, disabled && { opacity: 0.4 }]}
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
    >
      <View style={styles.center}>
        <Animated.View style={[styles.inner, inner]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', padding: 5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { backgroundColor: colors.danger },
});
