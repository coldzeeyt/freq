import type { BoardPost, Comment, Creator } from '@/types/models';
import { hotScore } from '@/lib/hot';
import { readJSON, writeJSON } from '../storage';
import type { TalkService } from '../types';

const KEY = 'talk';

interface Store {
  posts: BoardPost[];
  comments: (Comment & { targetType: 'post' | 'video'; targetId: string })[];
}

/** Offline Talk: everything lives on this device. `me` is resolved lazily from the account. */
export function createLocalTalk(me: () => Promise<Creator>): TalkService {
  let store: Store | null = null;
  const load = async () => (store ??= await readJSON<Store>(KEY, { posts: [], comments: [] }));
  const save = () => writeJSON(KEY, store);
  const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    async listPosts(stationId, sort) {
      const posts = (await load()).posts.filter((p) => stationId === 'all' || p.stationId === stationId);
      if (sort === 'new') return [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      if (sort === 'top') return [...posts].sort((a, b) => b.score - a.score);
      return [...posts].sort((a, b) => hotScore(b.score, b.createdAt) - hotScore(a.score, a.createdAt));
    },
    async getPost(postId) {
      const s = await load();
      const post = s.posts.find((p) => p.id === postId);
      if (!post) throw new Error('That post is gone.');
      return { post, comments: s.comments.filter((c) => c.targetType === 'post' && c.targetId === postId) };
    },
    async createPost(stationId, title, body) {
      const post: BoardPost = {
        id: id(),
        stationId,
        title: title.trim(),
        body: body.trim(),
        author: await me(),
        score: 1,
        myVote: 1,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      };
      (await load()).posts.unshift(post);
      await save();
      return post;
    },
    async deletePost(postId) {
      const s = await load();
      s.posts = s.posts.filter((p) => p.id !== postId);
      s.comments = s.comments.filter((c) => !(c.targetType === 'post' && c.targetId === postId));
      await save();
    },
    async listComments(target) {
      return (await load()).comments.filter((c) => c.targetType === target.type && c.targetId === target.id);
    },
    async addComment(target, body, parentId) {
      const s = await load();
      const comment = {
        id: id(),
        parentId,
        body: body.trim(),
        author: await me(),
        deleted: false,
        score: 1,
        myVote: 1 as const,
        createdAt: new Date().toISOString(),
        targetType: target.type,
        targetId: target.id,
      };
      s.comments.push(comment);
      const post = target.type === 'post' ? s.posts.find((p) => p.id === target.id) : null;
      if (post) post.commentCount += 1;
      await save();
      return comment;
    },
    async deleteComment(commentId) {
      const c = (await load()).comments.find((x) => x.id === commentId);
      if (c) Object.assign(c, { deleted: true, body: '', author: null });
      await save();
    },
    async vote(target, value) {
      const s = await load();
      const item = target.type === 'post' ? s.posts.find((p) => p.id === target.id) : s.comments.find((c) => c.id === target.id);
      if (!item) throw new Error('Not found.');
      item.score += value - item.myVote;
      item.myVote = value;
      await save();
      return item.score;
    },
  };
}
