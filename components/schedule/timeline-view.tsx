import { StyleSheet, View, ScrollView } from 'react-native';
import { useEffect, useMemo } from 'react';

import { TimeBlock } from './time-block';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Borders, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useScheduleStore } from '@/stores/use-schedule-store';
import type { StudySession, FixedEvent } from '@/lib/types';

type TimelineEvent = {
  type: 'session' | 'fixed';
  startTime: Date;
  data: StudySession | FixedEvent;
};

// Helper to parse "HH:MM:SS" time string to Date
function parseTimeToDate(timeStr: string, dateStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function TimelineView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { selectedDate, sessions, fixedEvents, isLoading, fetchAgenda } = useScheduleStore();

  useEffect(() => {
    fetchAgenda(selectedDate);
  }, [selectedDate, fetchAgenda]);

  // Memoize sorted events to prevent recalculation on every render
  const sortedEvents = useMemo<TimelineEvent[]>(() => {
    return [
      ...sessions.map((s) => ({
        type: 'session' as const,
        startTime: new Date(s.startTime),
        data: s,
      })),
      ...fixedEvents.map((f) => ({
        type: 'fixed' as const,
        startTime: parseTimeToDate(f.startTime, selectedDate),
        data: f,
      })),
    ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [sessions, fixedEvents, selectedDate]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const totalMinutes = sessions.reduce((acc, s) => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return acc + (end.getTime() - start.getTime()) / 60000;
    }, 0);
    return { totalSessions, completedSessions, totalMinutes };
  }, [sessions]);

  if (isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText type="label">LOADING...</ThemedText>
      </ThemedView>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText type="subtitle">NO EVENTS</ThemedText>
        <ThemedText style={{ color: colors.muted }}>
          YOUR SCHEDULE IS CLEAR FOR TODAY
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <View style={styles.stat}>
          <ThemedText type="title">{stats.totalSessions}</ThemedText>
          <ThemedText type="label">SESSIONS</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <ThemedText type="title">{(stats.totalMinutes / 60).toFixed(1)}</ThemedText>
          <ThemedText type="label">HOURS</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <ThemedText type="title">{stats.completedSessions}</ThemedText>
          <ThemedText type="label">DONE</ThemedText>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        contentContainerStyle={styles.timelineContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedEvents.map((event) => (
          <View key={event.type === 'session' ? `session-${(event.data as StudySession).id}` : `fixed-${(event.data as FixedEvent).id}`}>
            {event.type === 'session' ? (
              <TimeBlock session={event.data as StudySession} />
            ) : (
              <TimeBlock fixedEvent={event.data as FixedEvent} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: Borders.thin,
    paddingVertical: Spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
});
