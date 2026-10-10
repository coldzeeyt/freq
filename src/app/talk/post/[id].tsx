import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentThread } from '@/components/talk/CommentThread';
import { VoteControl } from '@/components/talk/VoteControl';
import { useToast } from '@/components/ui/Toast';
import { getStation } from '@/data/stations';
import { timeAgo } from '@/lib/hot';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts } from '@/theme';
import type { BoardPost, Comment } from '@/types/models';

/** One Talk post with its threaded comments. */
export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { me } = useFreq();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  useEffect(() => {
    services.talk
      .getPost(String(id))
      .then((r) => {
        setPost(r.post);
        setComments(r.comments);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const station = post ? getStation(post.stationId) : null;

  const onDelete = async () => {
    if (!post) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await services.talk.deletePost(post.id);
      toast('Post deleted');
      back();
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10} style={styles.headerBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{station ? `${station.frequency.toFixed(1)} ${station.name} Talk` : 'Talk'}</Text>
        <View style={styles.headerBtn} />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !post ? (
        <ActivityIndicator style={styles.loading} color={colors.text} />
      ) : (
        <CommentThread
          target={{ type: 'post', id: post.id }}
          comments={comments}
          onChange={setComments}
          header={
            <Animated.View entering={FadeInDown.duration(260)} style={styles.post}>
              <Text style={styles.meta}>
                @{post.author.handle} · {timeAgo(post.createdAt)}
              </Text>
              <Text style={styles.title}>{post.title}</Text>
              {!!post.body && <Text style={styles.body}>{post.body}</Text>}
              <View style={styles.postActions}>
                <VoteControl target={{ type: 'post', id: post.id }} score={post.score} myVote={post.myVote} direction="row" onError={toast} />
                {post.author.id === me.id && (
                  <Pressable hitSlop={8} onPress={onDelete} accessibilityLabel="Delete post">
                    <Text style={[styles.delete, confirmDelete && styles.deleteConfirm]}>
                      {confirmDelete ? 'Tap again to delete' : 'Delete'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 15 },
  loading: { marginTop: 60 },
  error: { color: colors.textDim, fontFamily: fonts.body, fontSize: 15, textAlign: 'center', marginTop: 60 },
  post: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  meta: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  title: { color: colors.text, fontFamily: fonts.heavy, fontSize: 22, lineHeight: 27, letterSpacing: -0.3 },
  body: { color: colors.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  postActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  delete: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 13 },
  deleteConfirm: { color: colors.danger },
});
