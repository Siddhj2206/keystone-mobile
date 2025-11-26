import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

// Validate API URL - throw clear error if missing in production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL && !__DEV__) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is required in production');
}

export const authClient = createAuthClient({
  baseURL: API_BASE_URL || 'http://localhost:3000',
  plugins: [
    expoClient({
      scheme: 'keystonemobile',
      storagePrefix: 'keystone',
      storage: SecureStore,
    }),
  ],
});

// Guest mode storage key
const GUEST_MODE_KEY = 'keystone_guest_mode';

export const guestAuth = {
  async enableGuestMode() {
    await SecureStore.setItemAsync(GUEST_MODE_KEY, 'true');
  },
  async disableGuestMode() {
    await SecureStore.deleteItemAsync(GUEST_MODE_KEY);
  },
  async isGuestMode() {
    const value = await SecureStore.getItemAsync(GUEST_MODE_KEY);
    return value === 'true';
  },
};

// Export commonly used hooks and methods
export const { useSession, signIn, signUp, signOut } = authClient;
