import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HumanBadge } from '@/components/feed/HumanBadge';
import { CameraRecorder } from '@/components/post/CameraRecorder';
import { PostDetails } from '@/components/post/PostDetails';
import { MAX_SECONDS } from '@/components/post/recorderTypes';
import { useToast } from '@/components/ui/Toast';
import { getStation } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts, radius } from '@/theme';
import type { StationId, VideoOrigin } from '@/types/models';

type Step = { kind: 'choose' } | { kind: 'record' } | { kind: 'details'; uri: string; origin: VideoOrigin };

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const { setStation, me } = useFreq();
  const toast = useToast();
  // "Record one now" on an empty feed opens straight into the camera.
  const { start, vault: vaultParam } = useLocalSearchParams<{ start?: string; vault?: string }>();
  const vault = vaultParam === '1';
  const [step, setStep] = useState<Step>(start === 'record' ? { kind: 'record' } : { kind: 'choose' });
  const [posting, setPosting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const upload = async () => {
    haptics.tap();
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: MAX_SECONDS, quality: 1 });
    if (!result.canceled && result.assets[0]) setStep({ kind: 'details', uri: result.assets[0].uri, origin: 'upload' });
  };

  const post = async (target: StationId, tags: string[], caption: string) => {
    if (step.kind !== 'details') return;
    setPosting(true);
    try {
      const uri = await services.media.persist(step.uri);
      setProgress(0);
      await services.videos.createVideo({ localUri: uri, stationId: target, tags, caption, origin: step.origin, permanent: vault }, me, setProgress);
      haptics.success();
      setStation(target);
      const s = getStation(target);
      toast(vault ? 'Locked in the Vault. Forever.' : `On air at ${s.frequency.toFixed(1)} ${s.name}`);
      close();
    } catch (e) {
      haptics.warning();
      toast(`Couldn’t post: ${(e as Error).message}`);
      setPosting(false);
      setProgress(null);
    }
  };

  if (step.kind === 'record') {
    return (
      <CameraRecorder
        onRecorded={(uri) => setStep({ kind: 'details', uri, origin: 'camera' })}
        onCancel={() => setStep({ kind: 'choose' })}
      />
    );
  }

  if (step.kind === 'details') {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={styles.fill}>
        <PostDetails uri={step.uri} origin={step.origin} posting={posting} progress={progress} vault={vault} onBack={() => setStep({ kind: 'choose' })} onPost={post} />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close" style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.duration(280)} style={styles.title}>
          {vault ? 'Into the Vault' : 'Go on air'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(40).duration(280)} style={styles.subtitle}>
          {vault
            ? 'Whatever you lock in stays forever. No one can delete it: not you, not Freq.'
            : 'Tag it and Freq finds the station. Record here and it’s marked human.'}
        </Animated.Text>

        <View style={styles.options}>
          <Animated.View entering={FadeInDown.delay(90).duration(300)}>
            <Option
              icon="radio-button-on"
              title="Record"
              subtitle="Use the Freq camera, up to 60 seconds."
              badge={<HumanBadge />}
              onPress={() => {
                haptics.tap();
                setStep({ kind: 'record' });
              }}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(140).duration(300)}>
            <Option
              icon="folder-open-outline"
              title="Upload"
              subtitle="From your library. Unverified unless your account is verified."
              badge={<Text style={styles.unverified}>UNVERIFIED</Text>}
              onPress={upload}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

function Option(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
      accessibilityRole="button"
      accessibilityLabel={props.title}
    >
      <Ionicons name={props.icon} size={26} color={colors.signal} />
      <View style={styles.optionText}>
        <View style={styles.optionTitleRow}>
          <Text style={styles.optionTitle}>{props.title}</Text>
          {props.badge}
        </View>
        <Text style={styles.optionSubtitle}>{props.subtitle}</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', paddingHorizontal: 12 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 40, letterSpacing: -1.2, lineHeight: 42 },
  subtitle: { color: colors.textDim, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, maxWidth: 320 },
  options: { gap: 10, marginTop: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  optionPressed: { transform: [{ scale: 0.985 }], backgroundColor: colors.surfaceRaised },
  optionText: { flex: 1, gap: 4 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 17 },
  optionSubtitle: { color: colors.textDim, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  unverified: {
    color: colors.textDim,
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});
