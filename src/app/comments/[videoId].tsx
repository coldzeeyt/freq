import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentThread } from '@/components/talk/CommentThread';
import { services } from '@/services';
import { colors, fonts } from '@/theme';
import type { Comment } from '@/types/models';

/** Threaded comments on a video, shown as a sheet over the feed. */
export default function VideoComments() {
  const insets = useSafeAreaInsets();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    services.talk
      .listComments({ type: 'video', id: String(videoId) })
      .then(setComments)
      .catch((e: Error) => setError(e.message));
  }, [videoId]);

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top + 4, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerBtn} />
        <Text style={styles.title}>Comments</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Close comments">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : comments === null ? (
        <ActivityIndicator style={styles.loading} color={colors.text} />
      ) : (
        <CommentThread target={{ type: 'video', id: String(videoId) }} comments={comments} onChange={setComments} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  loading: { marginTop: 60 },
  error: { color: colors.textDim, fontFamily: fonts.body, textAlign: 'center', marginTop: 60 },
});
