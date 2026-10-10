import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { POSTABLE_STATIONS } from '@/data/stations';
import { haptics } from '@/lib/haptics';
import { normalizeTag } from '@/lib/tagRouting';
import { colors, fonts, noWebOutline, radius } from '@/theme';

const ALL_KEYWORDS = [...new Set(POSTABLE_STATIONS.flatMap((s) => s.keywords))].sort();
const STARTERS = ['funny', 'cooking', 'dog', 'music', 'gaming', 'workout', 'travel', 'art', 'skate', 'makeup'];
export const MAX_TAGS = 8;

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const t = normalizeTag(raw);
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return;
    haptics.detent();
    onChange([...tags, t]);
  };

  const onText = (text: string) => {
    // Space, comma or enter commits the tag being typed.
    if (/[\s,]$/.test(text)) {
      add(text);
      setDraft('');
    } else setDraft(text);
  };

  const suggestions = useMemo(() => {
    const q = normalizeTag(draft);
    const pool = q ? ALL_KEYWORDS.filter((k) => k.startsWith(q) && k !== q) : STARTERS;
    return pool.filter((k) => !tags.includes(k)).slice(0, 6);
  }, [draft, tags]);

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        {tags.map((t) => (
          <Animated.View key={t} entering={ZoomIn.duration(140)} exiting={FadeOut.duration(100)} layout={LinearTransition}>
            <Pressable
              onPress={() => onChange(tags.filter((x) => x !== t))}
              style={styles.chip}
              accessibilityLabel={`Remove tag ${t}`}
            >
              <Text style={styles.chipText}>#{t}</Text>
              <Ionicons name="close" size={12} color={colors.textFaint} />
            </Pressable>
          </Animated.View>
        ))}
        {tags.length < MAX_TAGS && (
          <TextInput
            value={draft}
            onChangeText={onText}
            onSubmitEditing={() => {
              add(draft);
              setDraft('');
            }}
            onKeyPress={(e) => {
              if (e.nativeEvent.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1));
            }}
            placeholder={tags.length ? 'add another' : 'type a tag, then space'}
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="done"
            style={[styles.input, noWebOutline]}
            accessibilityLabel="Tags"
          />
        )}
      </View>
      {suggestions.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                add(s);
                setDraft('');
              }}
              style={styles.suggestion}
              accessibilityLabel={`Add tag ${s}`}
            >
              <Text style={styles.suggestionText}>+ {s}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  box: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 46,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
  },
  chipText: { color: colors.text, fontFamily: fonts.mono, fontSize: 13 },
  input: { flexGrow: 1, minWidth: 120, height: 30, color: colors.text, fontFamily: fonts.mono, fontSize: 13, paddingHorizontal: 4 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestion: { paddingHorizontal: 8, paddingVertical: 4 },
  suggestionText: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 12 },
});
