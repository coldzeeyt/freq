import { Platform } from 'react-native';
import type { Account, BoardPost, Comment, Creator, Moment, OnAirToday, Video } from '@/types/models';
import { emptyProfile } from '../ranking/profile';
import type { AuthService, LikeService, MediaStore, OnAirService, SignalService, TalkService, VideoService } from '../types';
import { api, ApiError, getToken, setToken } from './client';

type Session = { token: string; account: Account };

export function createApiAuth(): AuthService {
  return {
    async currentAccount() {
      if (!(await getToken())) return null;
      try {
        return (await api<{ account: Account }>('/auth/me')).account;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await setToken(null);
        return null;
      }
    },
    async createAccount(input) {
      const s = await api<Session>('/auth/signup', { method: 'POST', json: input });
      await setToken(s.token);
      return s.account;
    },
    async signIn(email, password) {
      const s = await api<Session>('/auth/login', { method: 'POST', json: { email, password } });
      await setToken(s.token);
      return s.account;
    },
    async signOut() {
      await setToken(null);
    },
    async deleteAccount() {
      await api('/auth/delete', { method: 'POST' });
      await setToken(null);
    },
  };
}

export function createApiVideos(): VideoService {
  const listeners = new Set<() => void>();
  return {
    async getFeed({ stationId, humanOnly }) {
      const q = `station=${encodeURIComponent(stationId)}${humanOnly ? '&humanOnly=1' : ''}`;
      return (await api<{ videos: Video[] }>(`/feed?${q}`)).videos;
    },

    async createVideo(input, _author: Creator) {
      const form = new FormData();
      if (Platform.OS === 'web') {
        // Recordings and picks are blob:/data: URLs in the browser.
        const blob = await (await fetch(input.localUri)).blob();
        const ext = blob.type.includes('webm') ? 'webm' : blob.type.includes('quicktime') ? 'mov' : 'mp4';
        form.append('video', blob, `video.${ext}`);
      } else {
        const ext = input.localUri.split('?')[0].split('.').pop()?.toLowerCase() || 'mp4';
        const type = ext === 'mov' ? 'video/quicktime' : `video/${ext}`;
        // React Native's FormData takes a { uri, name, type } file descriptor.
        form.append('video', { uri: input.localUri, name: `video.${ext}`, type } as unknown as Blob);
      }
      form.append('stationId', input.stationId);
      form.append('tags', JSON.stringify(input.tags));
      form.append('caption', input.caption);
      form.append('origin', input.origin);
      const { video } = await api<{ video: Video }>('/videos', { method: 'POST', body: form });
      listeners.forEach((l) => l());
      return video;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function createApiLikes(): LikeService {
  return {
    async getLikedIds() {
      try {
        return (await api<{ ids: string[] }>('/likes')).ids;
      } catch {
        return [];
      }
    },
    async setLiked(videoId, liked) {
      await api(`/videos/${encodeURIComponent(videoId)}/like`, { method: 'POST', json: { liked } }).catch(() => {});
    },
  };
}

/** Watch time and shares go to the server, which keeps each person's taste profile. */
export function createApiSignals(): SignalService {
  return {
    async record(event) {
      // Likes are learned from the like endpoint itself.
      if (event.type === 'like') return;
      await api('/events', { method: 'POST', json: event }).catch(() => {});
    },
    async getProfile() {
      return emptyProfile();
    },
  };
}

/** Files go straight to the server in createVideo, so nothing to do locally. */
export function createApiMediaStore(): MediaStore {
  return { persist: async (uri) => uri };
}

export function createApiTalk(): TalkService {
  const path = (t: { type: 'post' | 'video'; id: string }) => `/${t.type === 'post' ? 'posts' : 'videos'}/${encodeURIComponent(t.id)}`;
  return {
    async listPosts(stationId, sort) {
      return (await api<{ posts: BoardPost[] }>(`/boards/${encodeURIComponent(stationId)}/posts?sort=${sort}`)).posts;
    },
    getPost: (id) => api(`/posts/${encodeURIComponent(id)}`),
    async createPost(stationId, title, body) {
      return (await api<{ post: BoardPost }>(`/boards/${encodeURIComponent(stationId)}/posts`, { method: 'POST', json: { title, body } })).post;
    },
    async deletePost(id) {
      await api(`/posts/${encodeURIComponent(id)}/delete`, { method: 'POST' });
    },
    async listComments(target) {
      return (await api<{ comments: Comment[] }>(`${path(target)}/comments`)).comments;
    },
    async addComment(target, body, parentId) {
      return (await api<{ comment: Comment }>(`${path(target)}/comments`, { method: 'POST', json: { body, parentId } })).comment;
    },
    async deleteComment(id) {
      await api(`/comments/${encodeURIComponent(id)}/delete`, { method: 'POST' });
    },
    async vote(target, value) {
      return (await api<{ score: number }>('/vote', { method: 'POST', json: { targetType: target.type, targetId: target.id, value } })).score;
    },
  };
}

async function appendImage(form: FormData, field: string, uri: string) {
  if (Platform.OS === 'web') {
    form.append(field, await (await fetch(uri)).blob(), `${field}.jpg`);
  } else {
    form.append(field, { uri, name: `${field}.jpg`, type: 'image/jpeg' } as unknown as Blob);
  }
}

export function createApiOnAir(): OnAirService {
  const tz = () => new Date().getTimezoneOffset();
  return {
    today: () => api<OnAirToday>(`/onair?tz=${tz()}`),
    async post(backUri, frontUri, caption) {
      const form = new FormData();
      await appendImage(form, 'back', backUri);
      await appendImage(form, 'front', frontUri);
      form.append('caption', caption);
      form.append('tz', String(tz()));
      return (await api<{ moment: Moment }>('/onair', { method: 'POST', body: form })).moment;
    },
    async remove() {
      await api(`/onair/delete?tz=${tz()}`, { method: 'POST' });
    },
  };
}
