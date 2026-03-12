import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const hasLocalStorage =
  typeof globalThis !== 'undefined' && 'localStorage' in globalThis;

const getLocalStorage = () => {
  if (!hasLocalStorage) {
    return null;
  }
  try {
    return globalThis.localStorage;
  } catch (error) {
    return null;
  }
};

export const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      const store = getLocalStorage();
      return store?.getItem(key) ?? null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      const store = getLocalStorage();
      return store?.getItem(key) ?? null;
    }
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      const store = getLocalStorage();
      store?.setItem(key, value);
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (error) {
      const store = getLocalStorage();
      store?.setItem(key, value);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      const store = getLocalStorage();
      store?.removeItem(key);
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch (error) {
      const store = getLocalStorage();
      store?.removeItem(key);
    }
  },
};
