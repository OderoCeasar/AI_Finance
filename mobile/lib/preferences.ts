import { storage } from '@/lib/storage';

const buildKey = (key: string) => `preferences.${key}`;

export async function loadPreference<T>(key: string, fallback: T): Promise<T> {
  const stored = await storage.getItem(buildKey(key));
  if (!stored) {
    return fallback;
  }
  try {
    return JSON.parse(stored) as T;
  } catch (error) {
    return fallback;
  }
}

export async function savePreference<T>(key: string, value: T): Promise<void> {
  await storage.setItem(buildKey(key), JSON.stringify(value));
}
