import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { HumanBadge } from '@/components/feed/HumanBadge';
import { Avatar } from '@/components/ui/Avatar';
import { haptics } from '@/lib/haptics';
import { timeAgo } from '@/lib/hot';
import { colors, fonts, radius } from '@/theme';
import type { Moment } from '@/types/models';

interface Props {
  moment: Pick<Moment, 'backUri' | 'frontUri' | 'caption' | 'late' | 'createdAt'> & { author?: Moment['author'] };
  index?: number;
  /** Hide the author row (e.g. while previewing your own capture). */
  bare?: boolean;
}

/** BeReal-style: the back photo fills the card, the front photo sits in the corner. Tap the corner to swap. */
export function MomentCard({ moment, index = 0, bare }: Props) {
  const [swapped, setSwapped] = useState(false);
  const main = swapped ? moment.frontUri : moment.backUri;
  const inset = swapped ? moment.backUri : moment.frontUri;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).duration(300)} style={styles.wrap}>
      {!bare && moment.author && (
        <View style={styles.head}>
          <Avatar creator={moment.author} size={30} />
          <View style={styles.headText}>
            <View style={styles.nameRow}>
              <Text style={styles.handle}>@{moment.author.handle}</Text>
              <HumanBadge />
            </View>
            <Text style={styles.when}>
              {timeAgo(moment.createdAt) === 'now' ? 'just now' : `${timeAgo(moment.createdAt)} ago`}
              {moment.late ? '' : ' · on time'}
            </Text>
          </View>
          {moment.late && <Text style={styles.late}>LATE</Text>}
        </View>
      )}
      <View style={styles.photo}>
        <Image source={{ uri: main }} style={styles.fill} resizeMode="cover" />
        <Pressable
          onPress={() => {
            haptics.tap();
            setSwapped((s) => !s);
          }}
          style={styles.insetWrap}
          accessibilityLabel="Swap photos"
        >
          <Animated.View key={inset} entering={ZoomIn.duration(180)} style={styles.inset}>
            <Image source={{ uri: inset }} style={styles.fill} resizeMode="cover" />
          </Animated.View>
        </Pressable>
      </View>
      {!!moment.caption && <Text style={styles.caption}>{moment.caption}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headText: { flex: 1, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  when: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  late: {
    color: colors.signal,
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: colors.signal,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
  fill: { width: '100%', height: '100%' },
  insetWrap: { position: 'absolute', top: 12, left: 12, width: '30%', aspectRatio: 3 / 4 },
  inset: { flex: 1, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: colors.bg },
  caption: { color: colors.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
});
