import * as SecureStore from 'expo-secure-store';

const KEY = 'raikaro_recently_viewed';
const MAX = 10;

export async function addRecentlyViewed(productId: string): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX);
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  } catch {}
}

export async function getRecentlyViewedIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
