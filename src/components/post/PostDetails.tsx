import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HumanBadge } from '@/components/feed/HumanBadge';
import { useFreq } from '@/state/FreqProvider';
import { getStation } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { hashtagsIn, routeTags } from '@/lib/tagRouting';
import { colors, fonts, noWebOutline, radius } from '@/theme';
import type { StationId, VideoOrigin } from '@/types/models';
import { HoldToLock } from '@/components/vault/HoldToLock';
import { StationPicker } from './StationPicker';
import { TagInput } from './TagInput';

const MAX_CAPTION = 150;

interface Props {
  uri: string;
  origin: VideoOrigin;
  posting: boolean;
  /** 0..1 while the file uploads. */
  progress: number | null;
  /** Posting into the Vault (permanent). */
  vault?: boolean;
  onBack: () => void;
  onPost: (stationId: StationId, tags: string[], caption: string) => void;
}

export function PostDetails({ uri, origin, posting, progress, vault, onBack, onPost }: Props) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [override, setOverride] = useState<StationId | null>(null);
  const [picking, setPicking] = useState(false);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { me } = useFreq();
  const human = origin === 'camera' || me.verified;

  // Tags typed in + hashtags written in the caption both count.
  const allTags = useMemo(() => [...new Set([...tags, ...hashtagsIn(caption)])], [tags, caption]);
  const matches = useMemo(() => routeTags(allTags), [allTags]);
  const auto = matches[0]?.station.id ?? null;
  const target = override ?? auto;
  const station = target ? getStation(target) : null;
  const matched = matches.find((m) => m.station.id === target)?.matched ?? [];
  // With no tag match there's nothing to guess from, so show the stations right away.
  const showPicker = picking || !target;
  const [nudge, setNudge] = useState(false);

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Back" style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Details</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.duration(260)} style={styles.previewRow}>
          <View style={styles.preview}>
            <VideoView player={player} style={styles.previewVideo} contentFit="cover" nativeControls={false} />
          </View>
          <View style={styles.originBox}>
            {human ? <HumanBadge size="md" /> : <Text style={styles.unverified}>UNVERIFIED</Text>}
            <Text style={styles.originTitle}>{human ? 'Recorded in Freq' : 'Uploaded video'}</Text>
            <Text style={styles.originText}>
              {human
                ? 'Shows everywhere, including for people listening with Human only on.'
                : 'Hidden when someone turns on Human only. Record in Freq to get the Human label.'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(260)} style={styles.field}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Say something about it. #hashtags count as tags"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, noWebOutline]}
            multiline
            maxLength={MAX_CAPTION}
          />
          <Text style={styles.counter}>
            {caption.length}/{MAX_CAPTION}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(260)} style={styles.field}>
          <Text style={styles.label}>Tags</Text>
          <TagInput tags={tags} onChange={setTags} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(260)} layout={LinearTransition} style={styles.routeCard}>
          <Text style={styles.label}>Station</Text>
          {station ? (
            <Animated.View key={station.id} entering={FadeIn.duration(200)} style={styles.routeMain}>
              <Text style={styles.routeFreq}>{station.frequency.toFixed(1)}</Text>
              <View style={styles.routeText}>
                <Text style={styles.routeName}>{station.name}</Text>
                <Text style={styles.routeWhy}>
                  {override
                    ? 'picked by you'
                    : `from ${matched
                        .slice(0, 3)
                        .map((t) => `#${t}`)
                        .join(' ')}`}
                </Text>
              </View>
            </Animated.View>
          ) : (
            <Text style={[styles.routeEmpty, nudge && styles.routeNudge]}>
              Pick a station below, or add a tag and Freq will pick one for you.
            </Text>
          )}

          {matches.length > 1 && !picking && (
            <View style={styles.altRow}>
              <Text style={styles.altLabel}>also fits</Text>
              {matches
                .filter((m) => m.station.id !== target)
                .slice(0, 3)
                .map((m) => (
                  <Pressable
                    key={m.station.id}
                    onPress={() => {
                      haptics.detent();
                      setOverride(m.station.id);
                    }}
                    style={styles.alt}
                  >
                    <Text style={styles.altText}>{m.station.name}</Text>
                  </Pressable>
                ))}
            </View>
          )}

          {!!target && (
            <Pressable onPress={() => setPicking((p) => !p)} hitSlop={6} style={styles.chooseBtn}>
              <Text style={styles.chooseText}>{picking ? 'Done' : 'Choose a different station'}</Text>
            </Pressable>
          )}
          {showPicker && (
            <Animated.View entering={FadeIn}>
              <StationPicker
                value={target}
                onChange={(id) => {
                  setOverride(id === auto ? null : id);
                  setPicking(false);
                }}
              />
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {posting && progress !== null && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}
        {vault && (
          <View style={styles.vaultNote}>
            <Ionicons name="lock-closed" size={14} color={colors.text} />
            <Text style={styles.vaultText}>This goes in the Vault. It can never be deleted, by you or anyone at Freq.</Text>
          </View>
        )}
        {vault ? (
          <HoldToLock
            busy={posting}
            label={station ? `Hold to lock into ${station.name} forever` : 'Pick a station, then hold'}
            onLocked={() => {
              if (!target) {
                haptics.warning();
                setNudge(true);
                return;
              }
              onPost(target, allTags, caption);
            }}
          />
        ) : (
        <Pressable
          onPress={() => {
            if (posting) return;
            if (!target) {
              haptics.warning();
              setNudge(true);
              return;
            }
            onPost(target, allTags, caption);
          }}
          style={({ pressed }) => [styles.postBtn, posting && styles.postDisabled, pressed && { transform: [{ scale: 0.98 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Go on air"
        >
          {posting ? (
            <View style={styles.postingRow}>
              <ActivityIndicator color={colors.signalInk} />
              <Text style={styles.postText}>
                {progress !== null && progress < 1 ? `Uploading ${Math.round(progress * 100)}%` : 'Going on air…'}
              </Text>
            </View>
          ) : (
            <Text style={styles.postText}>
              {station ? `Go on air · ${station.frequency.toFixed(1)} ${station.name}` : 'Pick a station to go on air'}
            </Text>
          )}
        </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  body: { padding: 16, gap: 22, paddingBottom: 28 },
  previewRow: { flexDirection: 'row', gap: 14 },
  preview: { width: 104, aspectRatio: 9 / 16, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' },
  previewVideo: { width: '100%', height: '100%' },
  originBox: { flex: 1, gap: 6, justifyContent: 'center', alignItems: 'flex-start' },
  originTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  originText: { color: colors.textDim, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  unverified: {
    color: colors.textDim,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  field: { gap: 8 },
  label: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  input: {
    minHeight: 76,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    textAlignVertical: 'top',
  },
  counter: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11, alignSelf: 'flex-end' },
  routeCard: {
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  routeMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeFreq: { color: colors.signal, fontFamily: fonts.narrowBold, fontSize: 36, lineHeight: 38 },
  routeText: { gap: 2 },
  routeName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 18 },
  routeWhy: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  routeEmpty: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14 },
  routeNudge: { color: colors.signal },
  vaultNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  vaultText: { flex: 1, color: colors.textDim, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  postingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: colors.line, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: colors.signal },
  altRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  altLabel: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  alt: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.lineStrong },
  altText: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 12 },
  chooseBtn: { alignSelf: 'flex-start' },
  chooseText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 13, textDecorationLine: 'underline' },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  postBtn: { height: 50, borderRadius: radius.md, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  postDisabled: { opacity: 0.35 },
  postText: { color: colors.signalInk, fontFamily: fonts.bodyBold, fontSize: 15 },
});
