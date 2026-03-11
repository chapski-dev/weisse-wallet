import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Кроссплатформенное хранилище:
 * - iOS/Android: SecureStore (зашифрованное)
 * - Web: localStorage (незашифрованное, только для разработки!)
 */

export const secureStorage = {
	async setItemAsync(key: string, value: string): Promise<void> {
		if (Platform.OS === "web") {
			localStorage.setItem(key, value);
		} else {
			await SecureStore.setItemAsync(key, value);
		}
	},

	async getItemAsync(key: string): Promise<string | null> {
		if (Platform.OS === "web") {
			return localStorage.getItem(key);
		} else {
			return await SecureStore.getItemAsync(key);
		}
	},

	async deleteItemAsync(key: string): Promise<void> {
		if (Platform.OS === "web") {
			localStorage.removeItem(key);
		} else {
			await SecureStore.deleteItemAsync(key);
		}
	},
};
