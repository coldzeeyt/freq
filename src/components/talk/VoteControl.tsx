import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { compactCount } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { services } from '@/services';
import { colors, fonts } from '@/theme';
import type { Vote, VoteTarget } from '@/types/models';

export const DOWN_COLOR = '#8FA3C7';

interface Props {
  target: VoteTarget;
  score: number;
  myVote: Vote;
  direction?: 'row' | 'column';
  onError?: (message: string) => void;
}

/** Up/down arrows with optimistic updates. Tapping your current vote clears it. */
export function VoteControl({ target, score: initialScore, myVote: initialVote, direction = 'column', onError }: Props) {
  const [vote, setVote] = useState<Vote>(initialVote);
  const [score, setScore] = useState(initialScore);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));

  const cast = async (dir: 1 | -1) => {
    const next: Vote = vote === dir ? 0 : dir;
    const prevVote = vote;
    const prevScore = score;
    setVote(next);
    setScore(score + next - vote);
    haptics.detent();
    pop.set(withSequence(withTiming(1.2, { duration: 80 }), withSpring(1, { damping: 9, stiffness: 320 })));
    try {
      setScore(await services.talk.vote(target, next));
    } catch (e) {
      setVote(prevVote);
      setScore(prevScore);
      onError?.((e as Error).message);
    }
  };

  const tint = vote === 1 ? colors.signal : vote === -1 ? DOWN_COLOR : colors.textDim;
  return (
    <View style={[styles.wrap, direction === 'row' && styles.row]}>
      <Pressable onPress={() => cast(1)} hitSlop={8} accessibilityLabel="Upvote" accessibilityState={{ selected: vote === 1 }}>
        <Ionicons name={vote === 1 ? 'arrow-up-circle' : 'arrow-up-circle-outline'} size={22} color={vote === 1 ? colors.signal : colors.textFaint} />
      </Pressable>
      <Animated.View style={popStyle}>
        <Text style={[styles.score, { color: tint }]}>{score < 0 ? `-${compactCount(-score)}` : compactCount(score)}</Text>
      </Animated.View>
      <Pressable onPress={() => cast(-1)} hitSlop={8} accessibilityLabel="Downvote" accessibilityState={{ selected: vote === -1 }}>
        <Ionicons name={vote === -1 ? 'arrow-down-circle' : 'arrow-down-circle-outline'} size={22} color={vote === -1 ? DOWN_COLOR : colors.textFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2, minWidth: 34 },
  row: { flexDirection: 'row', gap: 6 },
  score: { fontFamily: fonts.narrowBold, fontSize: 14, minWidth: 18, textAlign: 'center' },
});
