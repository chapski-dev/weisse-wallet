import { createMMKV } from 'react-native-mmkv';

// Создаём инстанс MMKV
export const storage = createMMKV({
  id: 'weiss-wallet-storage',
});

// Обёртка с API похожим на AsyncStorage для удобства миграции
export const mmkvStorage = {
  getItem: (key: string): string | null => {
    return storage.getString(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    storage.set(key, value);
  },

  removeItem: (key: string): void => {
    storage.remove(key);
  },

  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },

  clear: (): void => {
    storage.clearAll();
  },

  // Для совместимости с кодом который использует async API
  getItemAsync: async (key: string): Promise<string | null> => {
    return storage.getString(key) ?? null;
  },

  setItemAsync: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },

  removeItemAsync: async (key: string): Promise<void> => {
    storage.remove(key);
  },
};
