import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Borders, Colors, Radius, HeaderStyles, IconSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        headerShown: true,
        tabBarButton: HapticTab,
        headerTitleStyle: HeaderStyles.title,
        headerStyle: {
          borderBottomWidth: Borders.regular,
          borderBottomColor: colors.border,
        },
        tabBarStyle: {
          borderTopWidth: Borders.regular,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          borderRadius: Radius.none,
        },
        tabBarLabelStyle: HeaderStyles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'TIMELINE',
          tabBarIcon: ({ color }) => <IconSymbol size={IconSizes.lg} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'SUBJECTS',
          tabBarIcon: ({ color }) => <IconSymbol size={IconSizes.lg} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'EXAMS',
          tabBarIcon: ({ color }) => <IconSymbol size={IconSizes.lg} name="doc.text.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
