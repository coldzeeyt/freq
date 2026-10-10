import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountForm } from '@/components/onboarding/AccountForm';
import { DialPractice } from '@/components/onboarding/DialPractice';
import { HumanFilterDemo } from '@/components/onboarding/HumanFilterDemo';
import { RadioWaves } from '@/components/onboarding/RadioWaves';
import { isTouchScreen } from '@/lib/device';
import { haptics } from '@/lib/haptics';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts, radius } from '@/theme';

const STEPS = ['hello', 'filter', 'dial', 'account'] as const;
type Step = (typeof STEPS)[number];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { account, hydrated, createAccount, signIn, setHumanOnly, setMuted } = useFreq();
  const [step, setStep] = useState<Step>('hello');
  const [mode, setMode] = useState<'create' | 'login'>('create');
  const [humanDemo, setHumanDemo] = useState(false);
  const [dialDone, setDialDone] = useState(false);
  const [finished, setFinished] = useState<string | null>(null);
  const replay = useLocalSearchParams<{ replay?: string }>().replay === '1';

  if (hydrated && account && !finished && !replay) return <Redirect href="/" />;

  const index = STEPS.indexOf(step);
  const go = (s: Step) => {
    haptics.tap();
    setStep(s);
  };
  const next = () => go(STEPS[Math.min(index + 1, STEPS.length - 1)]);

  const finish = (name: string) => {
    setHumanOnly(humanDemo);
    // The user has interacted, so the browser will now allow sound.
    if (Platform.OS === 'web') setMuted(false);
    setFinished(name);
    setTimeout(() => router.replace('/'), 1500);
  };

  if (finished) {
    return (
      <View style={[styles.screen, styles.center]}>
        <View style={styles.doneHero}>
          <View style={styles.waves}>
            <RadioWaves size={340} />
          </View>
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.doneMark}>
            <Ionicons name="checkmark" size={34} color={colors.signalInk} />
          </Animated.View>
        </View>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.doneTitle}>
          You’re on air, {finished.split(' ')[0]}.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250)} style={styles.doneSub}>
          Tuning to 88.1 All…
        </Animated.Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        {index > 0 ? (
          <Pressable onPress={() => go(STEPS[index - 1])} hitSlop={10} style={styles.back} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <ProgressSegment key={s} active={i <= index} />
          ))}
        </View>
        {step !== 'account' && !(replay && account) ? (
          <Pressable
            onPress={() => {
              setMode('create');
              go('account');
            }}
            hitSlop={10}
            style={styles.skip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skip} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'hello' && (
          <Animated.View key="hello" entering={FadeIn.duration(300)} exiting={FadeOutLeft.duration(200)} style={styles.page}>
            <View style={styles.hero}>
              <View style={styles.waves}>
                <RadioWaves size={300} />
              </View>
              <View style={styles.wordmarkRow}>
                {'freq'.split('').map((ch, i) => (
                  <Animated.Text key={i} entering={FadeInDown.delay(120 + i * 70).springify().damping(14)} style={styles.wordmark}>
                    {ch}
                  </Animated.Text>
                ))}
                <Animated.View entering={ZoomIn.delay(480)} style={styles.led} />
              </View>
            </View>
            <Animated.Text entering={FadeInDown.delay(420).duration(320)} style={styles.h1}>
              Welcome to Freq
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(500).duration(320)} style={styles.lede}>
              Short videos, tuned like a radio.
            </Animated.Text>
            <View style={styles.features}>
              <Feature delay={600} icon="disc-outline" title="Spin the dial" text="Turn the knob to change stations." />
              <Feature
                delay={680}
                icon="finger-print-outline"
                title="Filter out AI"
                text="Human only hides AI and unverified videos."
              />
              <Feature delay={760} icon="pricetags-outline" title="Tag it, it airs" text="Tags put your post on the right station." />
            </View>
            <Animated.View entering={FadeInDown.delay(860)} style={styles.actions}>
              <Primary label="Get started" onPress={next} />
              <Pressable
                onPress={() => {
                  setMode('login');
                  go('account');
                }}
                hitSlop={8}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>I already have an account</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}

        {step === 'filter' && (
          <Animated.View key="filter" entering={FadeInRight.duration(280)} exiting={FadeOutLeft.duration(200)} style={styles.page}>
            <Text style={styles.kicker}>02 · Human only</Text>
            <Text style={styles.h2}>Tune out the AI.</Text>
            <Text style={styles.lede}>
              Turn on Human only and Freq hides anything that wasn’t recorded in the app or posted by a verified creator. AI-generated
              clips, reposts and content farms drop off every station. Try it:
            </Text>
            <HumanFilterDemo value={humanDemo} onChange={setHumanDemo} />
            <Text style={styles.note}>You can switch it on or off any time from the top of the feed.</Text>
            <Primary label="Next" onPress={next} />
          </Animated.View>
        )}

        {step === 'dial' && (
          <Animated.View key="dial" entering={FadeInRight.duration(280)} exiting={FadeOutLeft.duration(200)} style={styles.page}>
            <Text style={styles.kicker}>03 · The dial</Text>
            <Text style={styles.h2}>Spin to tune.</Text>
            <Text style={styles.lede}>
              {isTouchScreen
                ? 'Drag around the knob, or tap its right or left side. Each click is a station.'
                : 'Scroll over the knob, drag it, or click its right or left side. Each click is a station.'}
            </Text>
            <DialPractice targets={['comedy', 'pets']} onComplete={() => setDialDone(true)} />
            <Primary label={dialDone ? 'Next' : 'Skip practice'} ghost={!dialDone} onPress={next} />
          </Animated.View>
        )}

        {step === 'account' && replay && account && (
          <Animated.View key="signed-in" entering={FadeInRight.duration(280)} style={styles.page}>
            <Text style={styles.kicker}>04 · Your account</Text>
            <Text style={styles.h2}>You’re signed in as @{account.handle}.</Text>
            <Primary label="Back to the feed" onPress={() => router.replace('/')} />
          </Animated.View>
        )}

        {step === 'account' && !(replay && account) && (
          <Animated.View key={`account-${mode}`} entering={FadeInRight.duration(280)} style={styles.page}>
            <Text style={styles.kicker}>{mode === 'create' ? '04 · Your account' : 'Welcome back'}</Text>
            <Text style={styles.h2}>{mode === 'create' ? 'Create your account.' : 'Log in.'}</Text>
            <AccountForm
              mode={mode}
              onModeChange={setMode}
              onCreate={async (input) => {
                await createAccount(input);
                finish(input.name);
              }}
              onLogin={async (email, password) => {
                await signIn(email, password);
                finish(email.split('@')[0]);
              }}
            />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProgressSegment({ active }: { active: boolean }) {
  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? 26 : 10, { damping: 18, stiffness: 220 }),
    backgroundColor: active ? colors.signal : colors.lineStrong,
  }));
  return <Animated.View style={[styles.segment, style]} />;
}

function Feature({ delay, icon, title, text }: { delay: number; icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(320)} style={styles.feature}>
      <Ionicons name={icon} size={20} color={colors.signal} />
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{text}</Text>
      </View>
    </Animated.View>
  );
}

function Primary({ label, onPress, ghost }: { label: string; onPress: () => void; ghost?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primary, ghost && styles.primaryGhost, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.primaryText, ghost && styles.primaryGhostText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  back: { width: 40, height: 32, justifyContent: 'center' },
  skip: { width: 40, alignItems: 'flex-end' },
  skipText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 14 },
  progress: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  segment: { height: 4, borderRadius: 2 },
  body: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8 },
  page: { flex: 1, gap: 16 },
  hero: { height: 230, alignItems: 'center', justifyContent: 'center' },
  waves: { position: 'absolute' },
  wordmarkRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wordmark: { color: colors.text, fontFamily: fonts.heavy, fontSize: 84, letterSpacing: -4, lineHeight: 88 },
  led: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.signal, marginTop: 16, marginLeft: 4 },
  h1: { color: colors.text, fontFamily: fonts.heavy, fontSize: 34, letterSpacing: -1, lineHeight: 38 },
  h2: { color: colors.text, fontFamily: fonts.heavy, fontSize: 32, letterSpacing: -1, lineHeight: 36 },
  kicker: { color: colors.signal, fontFamily: fonts.mono, fontSize: 11, marginTop: 8 },
  lede: { color: colors.textDim, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  note: { color: colors.textFaint, fontFamily: fonts.body, fontSize: 13 },
  features: { gap: 18, marginTop: 10 },
  feature: { flexDirection: 'row', gap: 12 },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  featureBody: { color: colors.textDim, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  actions: { gap: 12, marginTop: 'auto', paddingTop: 12 },
  primary: { height: 52, borderRadius: radius.md, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  primaryGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.lineStrong },
  primaryText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 16 },
  primaryGhostText: { color: colors.text },
  pressed: { transform: [{ scale: 0.98 }] },
  secondary: { alignSelf: 'center', paddingVertical: 6 },
  secondaryText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 14 },
  doneHero: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  doneMark: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: 28, letterSpacing: -0.6 },
  doneSub: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 12 },
});
