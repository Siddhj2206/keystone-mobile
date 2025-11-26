import { useEffect, useMemo, memo, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Borders, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import type { Assessment } from '@/lib/types';

const AssessmentCard = memo(function AssessmentCard({
  assessment,
  now,
  onPress,
}: {
  assessment: Assessment;
  now: Date;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const date = new Date(assessment.date);
  const isUpcoming = date > now;
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.assessmentCard}>
        <View style={styles.assessmentHeader}>
          <ThemedText type="subtitle">{assessment.title.toUpperCase()}</ThemedText>
          <ThemedText type="label" style={{ color: colors.muted }}>
            {assessment.weightage}%
          </ThemedText>
        </View>
        <View style={styles.assessmentMeta}>
          <ThemedText type="label">{formatDate(date)}</ThemedText>
          {isUpcoming && daysUntil > 0 && (
            <ThemedText
              type="label"
              style={{
                color: daysUntil <= 7 ? colors.accent : colors.muted,
              }}
            >
              {daysUntil === 1 ? 'TOMORROW' : `${daysUntil} DAYS`}
            </ThemedText>
          )}
          {!isUpcoming && (
            <ThemedText type="label" style={{ color: colors.muted }}>
              COMPLETED
            </ThemedText>
          )}
        </View>
        <ThemedText style={{ color: colors.muted }}>
          {assessment.topicIds.length} TOPICS
        </ThemedText>
      </Card>
    </Pressable>
  );
});

export default function ExamsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { assessments, fetchAssessments } = useSyllabusStore();

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Cache current date for consistent comparisons
  const now = useMemo(() => new Date(), []);

  // Memoize sorted and filtered assessments
  const { upcomingAssessments, pastAssessments } = useMemo(() => {
    const sorted = [...assessments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const upcoming = sorted.filter((a) => new Date(a.date) > now);
    const past = sorted.filter((a) => new Date(a.date) <= now);
    return { upcomingAssessments: upcoming, pastAssessments: past };
  }, [assessments, now]);

  const handleExamPress = useCallback((id: string) => {
    router.push(`/exams/${id}`);
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={[styles.stats, { borderBottomColor: colors.border }]}>
          <View style={styles.stat}>
            <ThemedText type="title">{upcomingAssessments.length}</ThemedText>
            <ThemedText type="label">UPCOMING</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="title">{pastAssessments.length}</ThemedText>
            <ThemedText type="label">COMPLETED</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="title">{assessments.length}</ThemedText>
            <ThemedText type="label">TOTAL</ThemedText>
          </View>
        </View>

        {/* Upcoming */}
        {upcomingAssessments.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              UPCOMING
            </ThemedText>
            {upcomingAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                now={now}
                onPress={() => handleExamPress(assessment.id)}
              />
            ))}
          </View>
        )}

        {/* Past */}
        {pastAssessments.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              PAST
            </ThemedText>
            {pastAssessments.map((assessment) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                now={now}
                onPress={() => handleExamPress(assessment.id)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {assessments.length === 0 && (
          <Card>
            <ThemedText style={{ textAlign: 'center', color: colors.muted }}>
              NO EXAMS YET. ADD YOUR FIRST EXAM TO START PLANNING.
            </ThemedText>
          </Card>
        )}

        {/* Add Exam Button */}
        <View style={styles.actions}>
          <Button
            title="+ ADD EXAM"
            variant="primary"
            onPress={() => router.push('/modals/add-exam')}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    paddingBottom: Spacing.lg,
    borderBottomWidth: Borders.thin,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  assessmentCard: {
    gap: Spacing.sm,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    marginTop: Spacing.md,
  },
});
