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
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      const store = getLocalStorage();
      return store?.getItem(key) ?? null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (error) {
      const store = getLocalStorage();
      store?.setItem(key, value);
    }
  },
  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch (error) {
      const store = getLocalStorage();
      store?.removeItem(key);
    }
  },
};
