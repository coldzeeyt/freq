import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getStation } from '@/data/stations';
import { timeAgo } from '@/lib/hot';
import { colors, fonts } from '@/theme';
import type { BoardPost } from '@/types/models';
import { VoteControl } from './VoteControl';

interface Props {
  post: BoardPost;
  index: number;
  showStation: boolean;
  onOpen: () => void;
  onError: (m: string) => void;
}

export function PostCard({ post, index, showStation, onOpen, onError }: Props) {
  const station = getStation(post.stationId);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 35).duration(260)}>
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={post.title}>
        <VoteControl target={{ type: 'post', id: post.id }} score={post.score} myVote={post.myVote} onError={onError} />
        <View style={styles.main}>
          <Text style={styles.meta}>
            {showStation && <Text style={styles.station}>{station.frequency.toFixed(1)} {station.name}  ·  </Text>}
            @{post.author.handle} · {timeAgo(post.createdAt)}
          </Text>
          <Text style={styles.title}>{post.title}</Text>
          {!!post.body && (
            <Text style={styles.body} numberOfLines={3}>
              {post.body}
            </Text>
          )}
          <Text style={styles.comments}>
            {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pressed: { backgroundColor: colors.surface },
  main: { flex: 1, gap: 4 },
  meta: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  station: { color: colors.textDim },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 21 },
  body: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  comments: { color: colors.textFaint, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 2 },
});

