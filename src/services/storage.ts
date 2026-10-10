import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'freq:v1:';

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing); the app keeps working in memory.
  }
}
