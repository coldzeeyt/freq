import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DialPractice } from '@/components/onboarding/DialPractice';
import { HumanFilterDemo } from '@/components/onboarding/HumanFilterDemo';
import { POSTABLE_STATIONS } from '@/data/stations';
import { haptics, hapticSupport, type HapticKind } from '@/lib/haptics';
import { useTuningSounds } from '@/lib/useTuningSounds';
import { colors, fonts, radius } from '@/theme';
import type { StationId } from '@/types/models';

const pickTargets = (): StationId[] => [...POSTABLE_STATIONS].sort(() => Math.random() - 0.5).slice(0, 3).map((s) => s.id);

const HAPTICS: { key: HapticKind; label: string; when: string }[] = [
  { key: 'detent', label: 'Detent', when: 'dial passes a station' },
  { key: 'lockIn', label: 'Lock-in', when: 'dial settles' },
  { key: 'page', label: 'Page', when: 'swipe to next video' },
  { key: 'tap', label: 'Tap', when: 'buttons, pause' },
  { key: 'like', label: 'Like', when: 'like / double tap' },
  { key: 'toggle', label: 'Toggle', when: 'Human only' },
  { key: 'heavy', label: 'Heavy', when: 'recording starts' },
  { key: 'success', label: 'Success', when: 'posted, saved' },
  { key: 'warning', label: 'Warning', when: 'something’s wrong' },
];

/** A place to try the dial, haptics, sounds and the Human only filter on their own. */
export default function Lab() {
  const insets = useSafeAreaInsets();
  const [targets, setTargets] = useState<StationId[]>(pickTargets);
  const [round, setRound] = useState(0);
  const [human, setHuman] = useState(false);
  const [lastHaptic, setLastHaptic] = useState<string | null>(null);
  const sounds = useTuningSounds(true);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Test lab</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}>
        <Section title="Dial" sub="Three random stations. Spin onto each one." delay={0}>
          <DialPractice key={round} targets={targets} />
          <Pressable
            style={styles.ghost}
            onPress={() => {
              haptics.tap();
              setTargets(pickTargets());
              setRound((r) => r + 1);
            }}
          >
            <Ionicons name="shuffle" size={15} color={colors.text} />
            <Text style={styles.ghostText}>New targets</Text>
          </Pressable>
        </Section>

        <Section title="Haptics" sub="Tap one to feel it. Each tile pulses when its haptic is sent." delay={80}>
          <SupportCard />
          <View style={styles.grid}>
            {HAPTICS.map((h) => (
              <HapticTile key={h.key} kind={h.key} label={h.label} when={h.when} active={lastHaptic === h.key} onFire={() => setLastHaptic(h.key)} />
            ))}
          </View>
        </Section>

        <Section title="Sound" sub="The dial’s click and the static between stations." delay={160}>
          <View style={styles.row}>
            <Pressable style={styles.ghost} onPress={sounds.playClick}>
              <Ionicons name="radio-button-on-outline" size={15} color={colors.text} />
              <Text style={styles.ghostText}>Click</Text>
            </Pressable>
            <Pressable
              style={styles.ghost}
              onPress={() => {
                sounds.startStatic();
                setTimeout(sounds.stopStatic, 900);
              }}
            >
              <Ionicons name="pulse-outline" size={15} color={colors.text} />
              <Text style={styles.ghostText}>Static</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Human only" sub="AI-generated and unverified posts drop out when it’s on." delay={240}>
          <HumanFilterDemo value={human} onChange={setHuman} />
        </Section>
      </ScrollView>
    </View>
  );
}

function SupportCard() {
  const support = hapticSupport();
  const icon = support.level === 'full' ? 'checkmark-circle' : support.level === 'partial' ? 'alert-circle' : 'close-circle';
  const tint = support.level === 'full' ? colors.text : support.level === 'partial' ? colors.signal : colors.textDim;
  return (
    <View style={styles.support}>
      <Ionicons name={icon} size={18} color={tint} />
      <View style={styles.supportText}>
        <Text style={[styles.supportLabel, { color: tint }]}>{support.label}</Text>
        <Text style={styles.supportDetail}>{support.detail}</Text>
      </View>
    </View>
  );
}

function HapticTile({ kind, label, when, active, onFire }: { kind: HapticKind; label: string; when: string; active: boolean; onFire: () => void }) {
  const pulse = useSharedValue(0);
  const [sent, setSent] = useState(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.get() * 0.05 }],
    backgroundColor: `rgba(255,90,31,${pulse.get() * 0.18})`,
  }));
  return (
    <Animated.View style={[styles.tileWrap, style]}>
      <Pressable
        onPress={() => {
          haptics[kind]();
          onFire();
          setSent((n) => n + 1);
          pulse.set(withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 14 })));
        }}
        style={({ pressed }) => [styles.tile, active && styles.tileActive, pressed && styles.pressed]}
        accessibilityLabel={`Play ${label} haptic`}
      >
        <View style={styles.tileTop}>
          <Text style={styles.tileTitle}>{label}</Text>
          {sent > 0 && (
            <Animated.View key={sent} entering={ZoomIn.duration(160)}>
              <Ionicons name="checkmark" size={13} color={colors.signal} />
            </Animated.View>
          )}
        </View>
        <Text style={styles.tileSub}>{when}</Text>
      </Pressable>
    </Animated.View>
  );
}

function Section({ title, sub, delay, children }: { title: string; sub: string; delay: number; children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{sub}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  body: { paddingHorizontal: 18, gap: 34, paddingTop: 8 },
  section: { gap: 4 },
  sectionTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: 22, letterSpacing: -0.4 },
  sectionSub: { color: colors.textDim, fontFamily: fonts.body, fontSize: 13 },
  sectionBody: { marginTop: 12, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  support: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  supportText: { flex: 1, gap: 3 },
  supportLabel: { fontFamily: fonts.bodyBold, fontSize: 14 },
  supportDetail: { color: colors.textDim, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  tileWrap: { width: '31.6%', borderRadius: radius.md },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tile: {
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 3,
  },
  tileActive: { borderColor: colors.signal },
  tileTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  tileSub: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 11, lineHeight: 14 },
  pressed: { transform: [{ scale: 0.95 }] },
  row: { flexDirection: 'row', gap: 8 },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  ghostText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
