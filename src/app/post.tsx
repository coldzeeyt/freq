import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraRecorder } from '@/components/post/CameraRecorder';
import { PostDetails } from '@/components/post/PostDetails';
import { MAX_SECONDS } from '@/components/post/recorderTypes';
import { useToast } from '@/components/ui/Toast';
import { getStation } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, radius } from '@/theme';
import type { Video, VideoOrigin } from '@/types/models';

type Step = { kind: 'choose' } | { kind: 'record' } | { kind: 'details'; uri: string; origin: VideoOrigin };

export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const { stationId, setStation } = useFreq();
  const toast = useToast();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [posting, setPosting] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const upload = async () => {
    haptics.tap();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: MAX_SECONDS,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) setStep({ kind: 'details', uri: result.assets[0].uri, origin: 'upload' });
  };

  const post = async (target: Video['stationId'], caption: string) => {
    if (step.kind !== 'details') return;
    setPosting(true);
    try {
      const uri = await services.media.persist(step.uri);
      await services.videos.createVideo({ localUri: uri, stationId: target, caption, origin: step.origin });
      haptics.success();
      setStation(target);
      const s = getStation(target);
      toast(`You're on air at ${s.frequency.toFixed(1)} ${s.name}`);
      close();
    } catch (e) {
      haptics.warning();
      toast(`Couldn't post: ${(e as Error).message}`);
      setPosting(false);
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
      <PostDetails
        uri={step.uri}
        origin={step.origin}
        initialStation={stationId === 'all' ? null : stationId}
        posting={posting}
        onBack={() => setStep({ kind: 'choose' })}
        onPost={post}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close" style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>New broadcast</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.options}>
        <Option
          icon="videocam"
          title="Record"
          subtitle="Use the Freq camera. Gets the Human badge automatically."
          accent={colors.human}
          tag="HUMAN"
          onPress={() => {
            haptics.tap();
            setStep({ kind: 'record' });
          }}
        />
        <Option
          icon="cloud-upload"
          title="Upload"
          subtitle="Pick a video from your library. Unverified unless your account is verified."
          accent={colors.textDim}
          tag="UNVERIFIED"
          onPress={upload}
        />
      </View>
    </View>
  );
}

function Option(props: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
  tag: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [styles.option, pressed && { transform: [{ scale: 0.98 }], backgroundColor: colors.surfaceRaised }]}
      accessibilityRole="button"
      accessibilityLabel={props.title}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={props.icon} size={28} color={colors.glow} />
      </View>
      <View style={styles.optionText}>
        <View style={styles.optionTitleRow}>
          <Text style={styles.optionTitle}>{props.title}</Text>
          <Text style={[styles.optionTag, { color: props.accent, borderColor: props.accent }]}>{props.tag}</Text>
        </View>
        <Text style={styles.optionSubtitle}>{props.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  options: { flex: 1, justifyContent: 'center', padding: 16, gap: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glowSoft,
  },
  optionText: { flex: 1, gap: 4 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  optionTag: { fontSize: 9, fontWeight: '800', letterSpacing: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  optionSubtitle: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
});
