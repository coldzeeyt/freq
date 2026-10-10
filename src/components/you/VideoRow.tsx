import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { HumanBadge } from '@/components/feed/HumanBadge';
import { VaultBadge } from '@/components/vault/VaultBadge';
import { getStation } from '@/data/stations';
import { compactCount } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { timeAgo } from '@/lib/hot';
import { isHumanMade } from '@/lib/human';
import { colors, fonts, radius } from '@/theme';
import type { Video } from '@/types/models';

interface Props {
  video: Video;
  showAuthor?: boolean;
  onDelete: (v: Video) => Promise<void>;
}

/** One of your videos: tap to preview, two taps on Delete to remove it. Vault videos can't be removed. */
export function VideoRow({ video, showAuthor, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const station = getStation(video.stationId);

  return (
    <Animated.View layout={LinearTransition.duration(180)} exiting={FadeOut.duration(180)} style={styles.card}>
      <Pressable
        onPress={() => {
          haptics.tap();
          setOpen((o) => !o);
        }}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Preview ${video.caption || 'video'}`}
      >
        <View style={styles.thumb}>
          <Text style={styles.thumbFreq}>{station.frequency.toFixed(1)}</Text>
          <Ionicons name={open ? 'pause' : 'play'} size={16} color={colors.text} />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            {showAuthor && <Text style={styles.author}>@{video.creator.handle}</Text>}
            {isHumanMade(video) && <HumanBadge />}
            {video.permanent && <VaultBadge />}
          </View>
          <Text style={styles.caption} numberOfLines={1}>
            {video.caption || 'No caption'}
          </Text>
          <Text style={styles.meta}>
            {station.name} · {compactCount(video.views)} views · {compactCount(video.likes)} likes · {timeAgo(video.createdAt)}
          </Text>
        </View>
        {video.permanent ? (
          <Ionicons name="lock-closed" size={16} color={colors.textFaint} accessibilityLabel="In the Vault, can't be deleted" />
        ) : (
          <Pressable
            onPress={async () => {
              if (!confirm) {
                haptics.warning();
                setConfirm(true);
                return;
              }
              setBusy(true);
              try {
                await onDelete(video);
              } finally {
                setBusy(false);
                setConfirm(false);
              }
            }}
            disabled={busy}
            hitSlop={8}
            style={[styles.delete, confirm && styles.deleteConfirm]}
            accessibilityLabel={confirm ? 'Confirm delete' : 'Delete video'}
          >
            <Ionicons name="trash-outline" size={14} color={confirm ? colors.bg : colors.danger} />
            {confirm && <Text style={styles.deleteText}>Delete?</Text>}
          </Pressable>
        )}
      </Pressable>
      {open && <Preview uri={video.uri} />}
    </Animated.View>
  );
}

function Preview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.preview}>
      <VideoView player={player} style={styles.previewVideo} contentFit="cover" nativeControls={false} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  thumb: { width: 46, height: 60, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', gap: 4 },
  thumbFreq: { color: colors.signal, fontFamily: fonts.mono, fontSize: 9 },
  text: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  author: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  caption: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 14 },
  meta: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 10 },
  delete: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 30, paddingHorizontal: 9, borderRadius: 15, borderWidth: 1, borderColor: colors.danger },
  deleteConfirm: { backgroundColor: colors.danger },
  deleteText: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 12 },
  preview: { alignItems: 'center', paddingBottom: 12 },
  previewVideo: { width: 180, aspectRatio: 9 / 16, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#000' },
});
