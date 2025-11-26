import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Borders, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { StudySession, FixedEvent } from '@/lib/types';

export type TimeBlockProps = {
  session?: StudySession;
  fixedEvent?: FixedEvent;
  onPress?: () => void;
};

export function TimeBlock({ session, fixedEvent, onPress }: TimeBlockProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  // Guard against both being undefined
  if (!session && !fixedEvent) {
    return null;
  }

  const isFixed = !!fixedEvent;
  const title = session?.topicTitle || fixedEvent?.title || '';
  const startTime = session?.startTime || fixedEvent?.startTime || '';
  const endTime = session?.endTime || fixedEvent?.endTime || '';
  const accentColor = session?.subjectColor || fixedEvent?.colorHex || colors.muted;

  // Format time for display
  const formatTime = (isoString: string) => {
    if (isoString.includes('T')) {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    // Already in HH:MM format
    return isoString.substring(0, 5);
  };

  // Calculate duration
  const getDuration = () => {
    if (session) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
      return `${mins} MIN`;
    }
    return '';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (session && session.status === 'scheduled') {
      router.push({
        pathname: '/modals/complete-session',
        params: { sessionId: session.id },
      });
    }
  };

  const getStatusIndicator = () => {
    if (!session) return null;
    switch (session.status) {
      case 'completed':
        return '[DONE]';
      case 'missed':
        return '[MISSED]';
      default:
        return session.sessionType === 'revision' ? '[REV]' : '';
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isFixed}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: isFixed ? colors.surface : colors.background,
          borderLeftColor: accentColor,
          opacity: pressed ? 0.8 : 1,
        },
        session?.status === 'completed' && styles.completed,
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="label">
          {formatTime(startTime)} - {formatTime(endTime)}
        </ThemedText>
        <View style={styles.headerRight}>
          {getStatusIndicator() && (
            <ThemedText type="label" style={{ color: colors.muted }}>
              {getStatusIndicator()}
            </ThemedText>
          )}
          {!isFixed && (
            <ThemedText type="label" style={{ color: colors.muted }}>
              {getDuration()}
            </ThemedText>
          )}
        </View>
      </View>
      <ThemedText
        type="subtitle"
        style={[
          styles.title,
          session?.status === 'completed' && styles.completedText,
        ]}
        numberOfLines={1}
      >
        {title.toUpperCase()}
      </ThemedText>
      {isFixed && (
        <ThemedText type="label" style={{ color: colors.muted }}>
          FIXED EVENT
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: Borders.regular,
    borderLeftWidth: Borders.heavy,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  title: {
    marginTop: Spacing.xs,
  },
  completed: {
    opacity: 0.6,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});
