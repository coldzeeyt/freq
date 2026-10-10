import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { HumanBadge } from '@/components/feed/HumanBadge';
import { HumanOnlyToggle } from '@/components/ui/HumanOnlyToggle';
import { haptics } from '@/lib/haptics';
import { colors, fonts, radius } from '@/theme';

const thumb = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-thumb-360-0.jpg`;

const SAMPLE = [
  { id: 'a', handle: '@maramakes', note: 'Recorded in Freq', human: true, img: thumb(5202) },
  { id: 'b', handle: '@clipfactory', note: 'AI-generated compilation', human: false, img: thumb(785) },
  { id: 'c', handle: '@lenalens', note: 'Verified creator', human: true, img: thumb(1545) },
  { id: 'd', handle: '@trendloop.daily', note: 'Unverified repost', human: false, img: thumb(4188) },
];

/** Flip Human only and watch the AI / unverified posts drop out. */
export function HumanFilterDemo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const shown = SAMPLE.filter((s) => !value || s.human);
  return (
    <View style={styles.wrap}>
      <View style={styles.toggleRow}>
        <Text style={styles.count}>
          {shown.length} of {SAMPLE.length} videos
        </Text>
        <HumanOnlyToggle
          value={value}
          onChange={(v) => {
            haptics.toggle();
            onChange(v);
          }}
        />
      </View>
      <View style={styles.list}>
        {shown.map((s, i) => (
          <Animated.View
            key={s.id}
            entering={FadeInDown.delay(i * 60).duration(260)}
            exiting={FadeOutLeft.duration(220)}
            layout={LinearTransition.springify().damping(18)}
            style={styles.row}
          >
            <Image source={{ uri: s.img }} style={styles.thumb} />
            <View style={styles.rowText}>
              <Text style={styles.handle}>{s.handle}</Text>
              <Text style={[styles.note, !s.human && styles.noteWarn]}>{s.note}</Text>
            </View>
            {s.human ? <HumanBadge /> : <Text style={styles.unverified}>UNVERIFIED</Text>}
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  thumb: { width: 40, height: 52, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
  rowText: { flex: 1, gap: 2 },
  handle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  note: { color: colors.textDim, fontFamily: fonts.body, fontSize: 12 },
  noteWarn: { color: colors.textFaint },
  unverified: {
    color: colors.textFaint,
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});
