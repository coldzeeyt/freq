import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, fonts, radius } from '@/theme';

const isStandalone = () =>
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true);

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isIOS = /iPhone|iPad|iPod/.test(ua);
const isAndroid = /Android/.test(ua);

/** Browser only: how to put Freq on the home screen so it opens like an app. */
export function InstallTip({ delay = 0 }: { delay?: number }) {
  const [open, setOpen] = useState(false);
  if (Platform.OS !== 'web' || isStandalone()) return null;

  const steps = isIOS
    ? ['Open this page in Safari', 'Tap the Share button (square with an arrow)', 'Tap “Add to Home Screen”, then Add']
    : isAndroid
      ? ['Open this page in Chrome', 'Tap the ⋮ menu', 'Tap “Install app” or “Add to Home screen”']
      : ['Open freqfm.up.railway.app on your phone', 'iPhone: Safari → Share → Add to Home Screen', 'Android: Chrome → ⋮ → Install app'];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(260)}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.card} accessibilityRole="button" accessibilityLabel="Add Freq to your home screen">
        <View style={styles.head}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.signal} />
          <View style={styles.headText}>
            <Text style={styles.title}>Add Freq to your Home Screen</Text>
            <Text style={styles.sub}>Opens full-screen like an app. Free, no app store.</Text>
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textFaint} />
        </View>
        {open && (
          <Animated.View entering={FadeIn.duration(180)} style={styles.steps}>
            {steps.map((s, i) => (
              <View key={s} style={styles.step}>
                <Text style={styles.num}>{i + 1}</Text>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.signal, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  sub: { color: colors.textDim, fontFamily: fonts.body, fontSize: 12 },
  steps: { gap: 8, paddingLeft: 34 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { color: colors.signal, fontFamily: fonts.mono, fontSize: 12, width: 12 },
  stepText: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
});
