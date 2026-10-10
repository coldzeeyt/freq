import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HumanBadge } from '@/components/feed/HumanBadge';
import { ME } from '@/data/mockCreators';
import { colors, radius } from '@/theme';
import type { Video, VideoOrigin } from '@/types/models';
import { StationPicker } from './StationPicker';

const MAX_CAPTION = 150;
type PostableId = Video['stationId'];

interface Props {
  uri: string;
  origin: VideoOrigin;
  initialStation: PostableId | null;
  posting: boolean;
  onBack: () => void;
  onPost: (stationId: PostableId, caption: string) => void;
}

export function PostDetails({ uri, origin, initialStation, posting, onBack, onPost }: Props) {
  const insets = useSafeAreaInsets();
  const [stationId, setStationId] = useState<PostableId | null>(initialStation);
  const [caption, setCaption] = useState('');
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const human = origin === 'camera' || ME.verified;

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Back" style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>New broadcast</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.previewRow}>
          <View style={styles.preview}>
            <VideoView player={player} style={styles.previewVideo} contentFit="cover" nativeControls={false} />
          </View>
          <View style={styles.originBox}>
            {human ? (
              <>
                <HumanBadge />
                <Text style={styles.originTitle}>Recorded in Freq</Text>
                <Text style={styles.originText}>Shows on every station, including Human Only.</Text>
              </>
            ) : (
              <>
                <View style={styles.unverified}>
                  <Text style={styles.unverifiedText}>UNVERIFIED</Text>
                </View>
                <Text style={styles.originTitle}>Uploaded video</Text>
                <Text style={styles.originText}>
                  Uploads from unverified creators are hidden when listeners turn on Human Only. Record in Freq to get the Human
                  badge.
                </Text>
              </>
            )}
          </View>
        </View>

        <Text style={styles.label}>Station</Text>
        <StationPicker value={stationId} onChange={setStationId} />

        <Text style={styles.label}>Caption</Text>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="What's on air?"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
          maxLength={MAX_CAPTION}
        />
        <Text style={styles.counter}>
          {caption.length}/{MAX_CAPTION}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => stationId && onPost(stationId, caption)}
          disabled={!stationId || posting}
          style={({ pressed }) => [styles.postBtn, (!stationId || posting) && styles.postDisabled, pressed && { transform: [{ scale: 0.98 }] }]}
          accessibilityRole="button"
          accessibilityLabel="Go on air"
        >
          {posting ? (
            <ActivityIndicator color="#1A1205" />
          ) : (
            <>
              <Ionicons name="radio" size={18} color="#1A1205" />
              <Text style={styles.postText}>{stationId ? 'Go on air' : 'Pick a station'}</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 17, fontWeight: '800' },
  body: { padding: 16, gap: 10, paddingBottom: 24 },
  previewRow: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  preview: { width: 120, aspectRatio: 9 / 16, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' },
  previewVideo: { width: '100%', height: '100%' },
  originBox: { flex: 1, gap: 6, justifyContent: 'center', alignItems: 'flex-start' },
  originTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  originText: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  unverified: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  unverifiedText: { color: colors.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  label: { color: colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 8 },
  input: {
    minHeight: 84,
    color: colors.text,
    fontSize: 15,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  counter: { color: colors.textFaint, fontSize: 12, alignSelf: 'flex-end' },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  postBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.glow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postDisabled: { opacity: 0.4 },
  postText: { color: '#1A1205', fontSize: 16, fontWeight: '800' },
});
