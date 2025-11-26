import { Stack } from 'expo-router';

import { Colors, HeaderStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AuthLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: HeaderStyles.title,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'LOGIN',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'REGISTER',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
