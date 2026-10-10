import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { timeAgo } from '@/lib/hot';
import { services } from '@/services';
import { useFreq } from '@/state/FreqProvider';
import { colors, fonts, noWebOutline, radius } from '@/theme';
import type { Comment, CommentTarget } from '@/types/models';
import { VoteControl } from './VoteControl';

interface Node {
  comment: Comment;
  children: Node[];
}

const MAX_INDENT = 6;

/** Builds the reply tree; siblings are ordered best-first (score, then oldest). */
function buildTree(comments: Comment[]): Node[] {
  const byId = new Map<string, Node>();
  comments.forEach((c) => byId.set(c.id, { comment: c, children: [] }));
  const roots: Node[] = [];
  byId.forEach((n) => {
    const parent = n.comment.parentId ? byId.get(n.comment.parentId) : null;
    (parent ? parent.children : roots).push(n);
  });
  const order = (list: Node[]) => {
    list.sort((a, b) => b.comment.score - a.comment.score || Date.parse(a.comment.createdAt) - Date.parse(b.comment.createdAt));
    list.forEach((n) => order(n.children));
  };
  order(roots);
  return roots;
}

const countAll = (n: Node): number => 1 + n.children.reduce((s, c) => s + countAll(c), 0);

interface Props {
  target: CommentTarget;
  comments: Comment[];
  onChange: (comments: Comment[]) => void;
  /** Rendered above the composer (e.g. the post itself). */
  header?: React.ReactNode;
}

/** Reddit-style threaded comments with a composer pinned to the bottom. */
export function CommentThread({ target, comments, onChange, header }: Props) {
  const toast = useToast();
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const tree = useMemo(() => buildTree(comments), [comments]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const c = await services.talk.addComment(target, body, replyTo?.id ?? null);
      haptics.success();
      onChange([...comments, c]);
      setDraft('');
      setReplyTo(null);
    } catch (e) {
      haptics.warning();
      toast((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (c: Comment) => {
    try {
      await services.talk.deleteComment(c.id);
      onChange(comments.map((x) => (x.id === c.id ? { ...x, deleted: true, body: '', author: null } : x)));
      toast('Comment deleted');
    } catch (e) {
      toast((e as Error).message);
    }
  };

  return (
    <View style={styles.fill}>
      <Animated.ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {header}
        <Text style={styles.count}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </Text>
        {tree.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <Text style={styles.emptyTitle}>No comments yet.</Text>
            <Text style={styles.emptyText}>Start the conversation.</Text>
          </Animated.View>
        ) : (
          tree.map((n, i) => <CommentNode key={n.comment.id} node={n} depth={0} index={i} onReply={setReplyTo} onDelete={remove} />)
        )}
      </Animated.ScrollView>

      <View style={styles.composer}>
        {replyTo && (
          <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(120)} style={styles.replying}>
            <Text style={styles.replyingText} numberOfLines={1}>
              Replying to @{replyTo.author?.handle ?? 'deleted'}
            </Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={8} accessibilityLabel="Cancel reply">
              <Ionicons name="close" size={16} color={colors.textDim} />
            </Pressable>
          </Animated.View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={replyTo ? 'Write a reply' : 'Add a comment'}
            placeholderTextColor={colors.textFaint}
            style={[styles.input, noWebOutline]}
            multiline
            numberOfLines={1}
            maxLength={2000}
            accessibilityLabel="Comment"
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || sending}
            style={[styles.send, (!draft.trim() || sending) && styles.sendOff]}
            accessibilityLabel="Send comment"
          >
            {sending ? <ActivityIndicator color={colors.signalInk} size="small" /> : <Ionicons name="arrow-up" size={18} color={colors.signalInk} />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function CommentNode({
  node,
  depth,
  index,
  onReply,
  onDelete,
}: {
  node: Node;
  depth: number;
  index: number;
  onReply: (c: Comment) => void;
  onDelete: (c: Comment) => void;
}) {
  const { me, isAdmin } = useFreq();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const c = node.comment;
  const mine = !c.deleted && (c.author?.id === me.id || isAdmin);

  return (
    <Animated.View
      entering={FadeInDown.delay(depth === 0 ? Math.min(index, 8) * 30 : 0).duration(220)}
      layout={LinearTransition.duration(180)}
      style={[styles.node, depth > 0 && styles.nested, depth >= MAX_INDENT && styles.flat]}
    >
      <Pressable
        onPress={() => {
          haptics.tap();
          setCollapsed((v) => !v);
        }}
        style={styles.head}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Expand thread' : 'Collapse thread'}
      >
        <Text style={[styles.handle, c.deleted && styles.deletedHandle]}>{c.deleted ? '[deleted]' : `@${c.author?.handle}`}</Text>
        <Text style={styles.when}>· {timeAgo(c.createdAt)}</Text>
        {collapsed && (
          <Text style={styles.collapsedNote}>
            {countAll(node)} {countAll(node) === 1 ? 'comment' : 'comments'} hidden
          </Text>
        )}
      </Pressable>

      {!collapsed && (
        <Animated.View entering={FadeIn.duration(160)}>
          <Text style={[styles.body, c.deleted && styles.deletedBody]}>{c.deleted ? 'This comment was deleted.' : c.body}</Text>
          {!c.deleted && (
            <View style={styles.actions}>
              <VoteControl target={{ type: 'comment', id: c.id }} score={c.score} myVote={c.myVote} direction="row" onError={toast} />
              <Pressable onPress={() => onReply(c)} hitSlop={8} style={styles.action} accessibilityLabel="Reply">
                <Ionicons name="return-down-forward-outline" size={15} color={colors.textDim} />
                <Text style={styles.actionText}>Reply</Text>
              </Pressable>
              {mine && (
                <Pressable onPress={() => onDelete(c)} hitSlop={8} style={styles.action} accessibilityLabel="Delete comment">
                  <Text style={styles.actionText}>Delete</Text>
                </Pressable>
              )}
            </View>
          )}
          {node.children.map((child, i) => (
            <CommentNode key={child.comment.id} node={child} depth={depth + 1} index={i} onReply={onReply} onDelete={onDelete} />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { paddingBottom: 24 },
  count: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 4 },
  emptyTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  emptyText: { color: colors.textDim, fontFamily: fonts.body, fontSize: 14 },
  node: { paddingLeft: 16, paddingRight: 12, paddingTop: 10 },
  // Each level of reply gets a thin rule on its left, like Reddit's thread lines.
  nested: { marginLeft: 4, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: colors.line },
  flat: { marginLeft: 0, paddingLeft: 0, borderLeftWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  handle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  deletedHandle: { color: colors.textFaint },
  when: { color: colors.textFaint, fontFamily: fonts.mono, fontSize: 11 },
  collapsedNote: { color: colors.signal, fontFamily: fonts.mono, fontSize: 11, marginLeft: 6 },
  body: { color: colors.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, marginTop: 2 },
  deletedBody: { color: colors.textFaint, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: colors.textDim, fontFamily: fonts.bodyMedium, fontSize: 12 },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, padding: 10, gap: 6, backgroundColor: colors.bg },
  replying: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  replyingText: { flex: 1, color: colors.textDim, fontFamily: fonts.mono, fontSize: 11 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.signal, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.35 },
});
