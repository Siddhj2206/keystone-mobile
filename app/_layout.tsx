import { DarkTheme, DefaultTheme, ThemeProvider, Theme } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';

import { Colors, HeaderStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authClient, guestAuth } from '@/lib/auth-client';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Brutalist theme overrides
const BrutalistLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.text,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.accent,
  },
};

const BrutalistDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.text,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.accent,
  },
};

function useProtectedRoute() {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { data: session, isPending } = authClient.useSession();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const checkAuthAndNavigate = useCallback(async () => {
    // Wait for navigation to be ready and session check to complete
    if (!navigationState?.key || isPending) return;

    setIsCheckingAuth(true);
    try {
      const isGuest = await guestAuth.isGuestMode();
      const inAuthGroup = segments[0] === '(auth)';
      const isAuthenticated = !!session?.user || isGuest;

      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (isAuthenticated && inAuthGroup) {
        router.replace('/(tabs)');
      }
    } catch {
      // If guest mode check fails, treat as unauthenticated
      const inAuthGroup = segments[0] === '(auth)';
      if (!session?.user && !inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } finally {
      setIsCheckingAuth(false);
    }
  }, [session, segments, navigationState?.key, isPending]);

  useEffect(() => {
    checkAuthAndNavigate();
  }, [checkAuthAndNavigate]);

  return isCheckingAuth;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useProtectedRoute();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? BrutalistDarkTheme : BrutalistLightTheme}>
      <Stack
        screenOptions={{
          headerTitleStyle: HeaderStyles.title,
          headerBackTitleStyle: HeaderStyles.backTitle,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="subjects/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="exams/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="modals/add-subject"
          options={{
            presentation: 'modal',
            title: 'ADD SUBJECT',
            headerTitleStyle: HeaderStyles.title,
          }}
        />
        <Stack.Screen
          name="modals/add-exam"
          options={{
            presentation: 'modal',
            title: 'ADD EXAM',
            headerTitleStyle: HeaderStyles.title,
          }}
        />
        <Stack.Screen
          name="modals/upload-syllabus"
          options={{
            presentation: 'modal',
            title: 'UPLOAD SYLLABUS',
            headerTitleStyle: HeaderStyles.title,
          }}
        />
        <Stack.Screen
          name="modals/complete-session"
          options={{
            presentation: 'modal',
            title: 'COMPLETE SESSION',
            headerTitleStyle: HeaderStyles.title,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
