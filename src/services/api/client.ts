import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Production server. The web build is served by it, so the browser can use relative URLs. */
const PRODUCTION = 'https://freqfm.up.railway.app';

export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? '' : PRODUCTION)).replace(/\/$/, '');

const TOKEN_KEY = 'freq:v1:token';
let token: string | null | undefined;

export async function getToken() {
  if (token === undefined) {
    try {
      token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      token = null;
    }
  }
  return token;
}

export async function setToken(next: string | null) {
  token = next;
  try {
    if (next) await AsyncStorage.setItem(TOKEN_KEY, next);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/** Changes once per app launch so the feed's exploration order is stable while browsing. */
const SESSION = String(Math.floor(Math.random() * 1e9));

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Freq-Session': SESSION, ...(init.headers as Record<string, string>) };
  const t = await getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let body = init.body;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError('Can’t reach Freq right now. Check your connection.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

/** Multipart upload with progress (fetch can't report upload progress; XHR can, on web and native). */
export async function uploadForm<T>(path: string, form: FormData, onProgress?: (fraction: number) => void): Promise<T> {
  const t = await getToken();
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api${path}`);
    xhr.setRequestHeader('X-Freq-Session', SESSION);
    if (t) xhr.setRequestHeader('Authorization', `Bearer ${t}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: { error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(data.error ?? (xhr.status === 413 ? 'That video is too big.' : `Upload failed (${xhr.status})`), xhr.status));
    };
    xhr.onerror = () => reject(new ApiError('Upload failed. Check your connection and try again.', 0));
    xhr.ontimeout = () => reject(new ApiError('Upload timed out. Try a shorter video or better signal.', 0));
    xhr.timeout = 10 * 60_000;
    xhr.send(form);
  });
}
