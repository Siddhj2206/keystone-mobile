import axios from 'axios';
import { router } from 'expo-router';

import { authClient, guestAuth } from '@/lib/auth-client';

// Validate API URL - throw clear error if missing in production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL && !__DEV__) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is required in production');
}

export const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth cookies
api.interceptors.request.use(
  async (config) => {
    const cookies = typeof authClient.getCookie === 'function' ? authClient.getCookie() : null;
    if (cookies && typeof cookies === 'string') {
      config.headers.Cookie = cookies;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear guest mode and redirect to login
      await guestAuth.disableGuestMode().catch(() => {});
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  }
);
