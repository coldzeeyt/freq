import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DualCapture } from '@/components/onair/DualCapture';
import { MomentCard } from '@/components/onair/MomentCard';
import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { clock, useOnAirClock } from '@/state/useOnAirClock';
import { colors, fonts, noWebOutline, radius } from '@/theme';

export default function OnAirCapture() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { phase, secondsLeft } = useOnAirClock();
  const [shots, setShots] = useState<{ back: string; front: string } | null>(null);
  const [retakesLeft, setRetakesLeft] = useState(1);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const done = () => (router.canGoBack() ? router.back() : router.replace('/onair'));

  if (!shots) return <DualCapture onCaptured={(back, front) => setShots({ back, front })} onCancel={done} />;

  const post = async () => {
    setPosting(true);
    try {
      await services.onAir.post(shots.back, shots.front, caption);
      haptics.success();
      toast(phase === 'live' ? 'You’re On Air' : 'Posted (late)');
      done();
    } catch (e) {
      haptics.warning();
      toast((e as Error).message);
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={done} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Discard">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.status, phase === 'live' && styles.statusLive]}>{phase === 'live' ? `ON AIR ${clock(secondsLeft)}` : 'LATE'}</Text>
        <View style={styles.headerBtn} />
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(220)}>
          <MomentCard moment={{ backUri: shots.back, frontUri: shots.front, caption: '', late: phase !== 'live', createdAt: new Date().toISOString() }} bare />
        </Animated.View>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption (optional)"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, noWebOutline]}
          maxLength={120}
          accessibilityLabel="Caption"
        />
        <View style={styles.row}>
          <Pressable
            onPress={() => {
              if (!retakesLeft) return;
              setRetakesLeft(0);
              setShots(null);
            }}
            disabled={!retakesLeft || posting}
            style={[styles.secondary, !retakesLeft && { opacity: 0.35 }]}
            accessibilityLabel="Retake"
          >
            <Text style={styles.secondaryText}>{retakesLeft ? 'Retake (1 left)' : 'No retakes left'}</Text>
          </Pressable>
          <Pressable onPress={post} disabled={posting} style={styles.primary} accessibilityLabel="Post On Air">
            {posting ? <ActivityIndicator color={colors.signalInk} /> : <Text style={styles.primaryText}>Post</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  status: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong },
  statusLive: { color: colors.signalInk, backgroundColor: colors.signal, borderColor: colors.signal },
  body: { padding: 16, gap: 14 },
  input: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 10 },
  secondary: { flex: 1, height: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14 },
  primary: { flex: 1, height: 50, borderRadius: radius.md, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 16 },
});
