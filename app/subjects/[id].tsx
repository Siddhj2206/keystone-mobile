import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicTree } from '@/components/syllabus/topic-tree';
import { Borders, Colors, Spacing, CommonStyles, DAYS_OF_WEEK } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import { useScheduleStore } from '@/stores/use-schedule-store';
import type { Topic, ClassSlot } from '@/lib/types';

// Helper to count topics recursively
function countTopics(topics: Topic[]): number {
  return topics.reduce((sum, t) => sum + 1 + (t.children ? countTopics(t.children) : 0), 0);
}

// Helper to count completed topics
function countCompletedTopics(topics: Topic[]): number {
  return topics.reduce((sum, t) => {
    const selfComplete = t.status === 'completed' ? 1 : 0;
    const childrenComplete = t.children ? countCompletedTopics(t.children) : 0;
    return sum + selfComplete + childrenComplete;
  }, 0);
}

export default function SubjectDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { subjects, fetchSubjects, getSubjectById } = useSyllabusStore();
  const { sessions } = useScheduleStore();

  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects();
    }
  }, [subjects.length, fetchSubjects]);

  const subject = getSubjectById(id);

  // Memoize stats
  const stats = useMemo(() => {
    if (!subject) return { totalTopics: 0, completedTopics: 0, needsRevision: 0 };
    const totalTopics = countTopics(subject.topics);
    const completedTopics = countCompletedTopics(subject.topics);
    const countNeedsRevision = (topics: Topic[]): number => {
      return topics.reduce((sum, t) => {
        const selfRevision = t.status === 'needs_revision' ? 1 : 0;
        const childrenRevision = t.children ? countNeedsRevision(t.children) : 0;
        return sum + selfRevision + childrenRevision;
      }, 0);
    };
    const needsRevision = countNeedsRevision(subject.topics);
    return { totalTopics, completedTopics, needsRevision };
  }, [subject]);

  // Get upcoming sessions for this subject
  const upcomingSessions = useMemo(() => {
    if (!subject) return [];
    const now = new Date();
    return sessions
      .filter((s) => s.subjectColor === subject.colorHex && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3);
  }, [sessions, subject]);

  const formatSlotTime = (slot: ClassSlot) => `${slot.startTime} - ${slot.endTime}`;

  if (!subject) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText type="subtitle">SUBJECT NOT FOUND</ThemedText>
        <Button title="GO BACK" variant="outline" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const formatSessionTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
    const timeStr = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    return { dateStr, timeStr };
  };

  const handleEdit = () => {
    router.push(`/modals/edit-subject?id=${id}`);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="label">{'< BACK'}</ThemedText>
          </Pressable>
          <Pressable onPress={handleEdit} hitSlop={8}>
            <ThemedText type="label">[EDIT]</ThemedText>
          </Pressable>
        </View>

        {/* Subject Info */}
        <View style={styles.subjectInfo}>
          <View style={[styles.colorBar, { backgroundColor: subject.colorHex }]} />
          <View style={styles.headerInfo}>
            <ThemedText type="title">{subject.name.toUpperCase()}</ThemedText>
            <ThemedText type="label" style={{ color: colors.muted }}>
              {Math.round(subject.progress * 100)}% COMPLETE
            </ThemedText>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { borderColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${subject.progress * 100}%`, backgroundColor: subject.colorHex },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
          <View style={styles.stat}>
            <ThemedText type="title">{stats.totalTopics}</ThemedText>
            <ThemedText type="label">TOPICS</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <ThemedText type="title">{stats.completedTopics}</ThemedText>
            <ThemedText type="label">DONE</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <ThemedText type="title" style={stats.needsRevision > 0 ? { color: colors.warning } : undefined}>
              {stats.needsRevision}
            </ThemedText>
            <ThemedText type="label">REVISION</ThemedText>
          </View>
        </View>

        {/* Class Schedule */}
        {subject.classSlots && subject.classSlots.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              CLASS SCHEDULE
            </ThemedText>
            {subject.classSlots.map((slot) => (
              <View
                key={slot.id}
                style={[styles.slotItem, { borderColor: colors.border }]}
              >
                <View style={styles.slotInfo}>
                  <ThemedText type="label">{DAYS_OF_WEEK[slot.dayOfWeek]}</ThemedText>
                  <ThemedText>{formatSlotTime(slot)}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.sectionLabel}>
            UPCOMING SESSIONS
          </ThemedText>
          {upcomingSessions.length === 0 ? (
            <Card>
              <ThemedText style={{ color: colors.muted, textAlign: 'center' }}>
                NO UPCOMING SESSIONS SCHEDULED
              </ThemedText>
            </Card>
          ) : (
            upcomingSessions.map((session) => {
              const { dateStr, timeStr } = formatSessionTime(session.startTime, session.endTime);
              return (
                <Card key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <ThemedText type="subtitle">{session.topicTitle.toUpperCase()}</ThemedText>
                    <ThemedText type="label" style={{ color: colors.muted }}>
                      {session.sessionType === 'revision' ? '[REV]' : '[NEW]'}
                    </ThemedText>
                  </View>
                  <View style={styles.sessionMeta}>
                    <ThemedText type="label">{dateStr}</ThemedText>
                    <ThemedText type="label" style={{ color: colors.muted }}>
                      {timeStr}
                    </ThemedText>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Topic Tree */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.sectionLabel}>
            TOPIC TREE
          </ThemedText>
          {subject.topics.length === 0 ? (
            <Card>
              <ThemedText style={{ color: colors.muted, textAlign: 'center' }}>
                NO TOPICS YET. UPLOAD A SYLLABUS TO GET STARTED.
              </ThemedText>
            </Card>
          ) : (
            <Card style={styles.topicCard}>
              <TopicTree topics={subject.topics} />
            </Card>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: CommonStyles.headerRow,
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorBar: CommonStyles.colorBar,
  headerInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressContainer: {
    ...CommonStyles.progressBarContainerLg,
    borderWidth: Borders.regular,
  },
  progressFill: CommonStyles.progressBarFill,
  statsRow: {
    ...CommonStyles.statsRow,
    paddingVertical: Spacing.md,
    paddingBottom: 0,
  },
  stat: {
    ...CommonStyles.stat,
    flex: 1,
  },
  statDivider: CommonStyles.statDivider,
  section: CommonStyles.section,
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: Borders.regular,
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sessionCard: {
    gap: Spacing.xs,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicCard: {
    padding: 0,
    paddingVertical: Spacing.sm,
  },
});
