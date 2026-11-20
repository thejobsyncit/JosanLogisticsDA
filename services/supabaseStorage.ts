/**
 * SecureStore Storage Adapter for Supabase Auth
 * Josan Logistics Driver App
 *
 * Uses Expo SecureStore for encrypted token storage on iOS/Android.
 * Implements chunking to safely bypass Android's 2048-byte Shared Preferences limit.
 * Falls back to AsyncStorage on Web platforms.
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CHUNK_SIZE = 1800; // Secure threshold safely under Android's 2048 byte limit
const CHUNK_MANIFEST_PREFIX = "__chunk_manifest__:";

export const SupabaseSecureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }

    try {
      const manifestOrValue = await SecureStore.getItemAsync(key);
      if (!manifestOrValue) return null;

      if (manifestOrValue.startsWith(CHUNK_MANIFEST_PREFIX)) {
        const chunkCount = parseInt(manifestOrValue.slice(CHUNK_MANIFEST_PREFIX.length), 10);
        let fullValue = "";
        for (let i = 0; i < chunkCount; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk === null) return null;
          fullValue += chunk;
        }
        return fullValue;
      }

      return manifestOrValue;
    } catch (err) {
      console.warn(`[SupabaseSecureStorage] getItem failed for key "${key}"`);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (err) {
        console.warn(`[SupabaseSecureStorage] setItem web failed for key "${key}"`);
      }
      return;
    }

    try {
      if (value.length <= CHUNK_SIZE) {
        // Clean up any old chunks if previously chunked
        await this.clearChunks(key);
        await SecureStore.setItemAsync(key, value);
      } else {
        const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < chunkCount; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
        }
        await SecureStore.setItemAsync(key, `${CHUNK_MANIFEST_PREFIX}${chunkCount}`);
      }
    } catch (err) {
      console.warn(`[SupabaseSecureStorage] setItem failed for key "${key}"`);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // Best effort
      }
      return;
    }

    try {
      await this.clearChunks(key);
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[SupabaseSecureStorage] removeItem failed for key "${key}"`);
    }
  },

  async clearChunks(key: string): Promise<void> {
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (raw && raw.startsWith(CHUNK_MANIFEST_PREFIX)) {
        const chunkCount = parseInt(raw.slice(CHUNK_MANIFEST_PREFIX.length), 10);
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
      }
    } catch {
      // Best effort cleanup
    }
  },
};

export default SupabaseSecureStorage;

