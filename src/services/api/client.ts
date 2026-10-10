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
