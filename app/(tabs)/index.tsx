import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimelineView } from '@/components/schedule/timeline-view';
import { Borders, Colors, Spacing, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useScheduleStore } from '@/stores/use-schedule-store';

// Helper to format date as YYYY-MM-DD in local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse YYYY-MM-DD string to local date
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { selectedDate, setSelectedDate } = useScheduleStore();

  const dateString = parseLocalDate(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  // Navigation helpers using local timezone
  const goToPreviousDay = () => {
    const current = parseLocalDate(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(formatLocalDate(current));
  };

  const goToNextDay = () => {
    const current = parseLocalDate(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(formatLocalDate(current));
  };

  const goToToday = () => {
    setSelectedDate(formatLocalDate(new Date()));
  };

  return (
    <ThemedView style={styles.container}>
      {/* Date Navigation */}
      <View style={[styles.dateNav, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={goToPreviousDay}
          style={styles.navButton}
          accessibilityLabel="Go to previous day"
          accessibilityRole="button"
        >
          <ThemedText type="subtitle">{'<'}</ThemedText>
        </Pressable>
        <Pressable
          onPress={goToToday}
          style={styles.dateDisplay}
          accessibilityLabel="Go to today"
          accessibilityRole="button"
        >
          <ThemedText type="title" style={styles.dateText}>
            {dateString}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={goToNextDay}
          style={styles.navButton}
          accessibilityLabel="Go to next day"
          accessibilityRole="button"
        >
          <ThemedText type="subtitle">{'>'}</ThemedText>
        </Pressable>
      </View>

      {/* Timeline */}
      <TimelineView />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: Borders.thin,
  },
  navButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: FontSizes.xl,
  },
});
