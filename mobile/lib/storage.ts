/**
 * Auth storage for Supabase. Uses AsyncStorage when the native module is available,
 * otherwise falls back to in-memory storage (session won't persist across app restarts).
 * This avoids "Native module is null" crashes in some Expo Go / simulator environments.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const memoryStore = new Map<string, string>();
let useMemoryOnly = false;

export const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (useMemoryOnly) return memoryStore.get(key) ?? null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      useMemoryOnly = true;
      return memoryStore.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (useMemoryOnly) {
      memoryStore.set(key, value);
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      useMemoryOnly = true;
      memoryStore.set(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (useMemoryOnly) {
      memoryStore.delete(key);
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      useMemoryOnly = true;
      memoryStore.delete(key);
    }
  },
};
