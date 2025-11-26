import { useState, useEffect, useMemo, memo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicTree } from '@/components/syllabus/topic-tree';
import { Borders, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import type { Subject, Topic } from '@/lib/types';

const ProgressBar = memo(function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.progressContainer, { borderColor: colors.border }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${progress * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
});

const SubjectCard = memo(function SubjectCard({ subject }: { subject: Subject }) {
  const [expanded, setExpanded] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Card style={styles.subjectCard}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.subjectHeader}>
          <View style={[styles.colorIndicator, { backgroundColor: subject.colorHex }]} />
          <View style={styles.subjectInfo}>
            <ThemedText type="subtitle">{subject.name.toUpperCase()}</ThemedText>
            <ThemedText type="label" style={{ color: colors.muted }}>
              {Math.round(subject.progress * 100)}% COMPLETE
            </ThemedText>
          </View>
          <ThemedText type="label">{expanded ? '[-]' : '[+]'}</ThemedText>
        </View>
        <ProgressBar progress={subject.progress} color={subject.colorHex} />
      </Pressable>

      {expanded && (
        <View style={[styles.topicList, { borderTopColor: colors.border }]}>
          <TopicTree topics={subject.topics} />
        </View>
      )}
    </Card>
  );
});

// Helper to count topics recursively
function countTopics(topics: Topic[]): number {
  return topics.reduce((sum, t) => sum + 1 + (t.children ? countTopics(t.children) : 0), 0);
}

export default function SubjectsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const { subjects, isLoading, fetchSubjects, getTotalProgress } = useSyllabusStore();

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Memoize expensive calculations
  const totalProgress = getTotalProgress();
  const totalTopics = useMemo(() => {
    return subjects.reduce((acc, s) => acc + countTopics(s.topics), 0);
  }, [subjects]);

  if (isLoading && subjects.length === 0) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText type="label">LOADING...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <View style={[styles.overview, { borderBottomColor: colors.border }]}>
          <View style={styles.overviewStat}>
            <ThemedText type="title">{subjects.length}</ThemedText>
            <ThemedText type="label">SUBJECTS</ThemedText>
          </View>
          <View style={styles.overviewStat}>
            <ThemedText type="title">{totalTopics}</ThemedText>
            <ThemedText type="label">TOPICS</ThemedText>
          </View>
          <View style={styles.overviewStat}>
            <ThemedText type="title">{Math.round(totalProgress * 100)}%</ThemedText>
            <ThemedText type="label">OVERALL</ThemedText>
          </View>
        </View>

        {/* Subject List */}
        <View style={styles.subjectList}>
          <ThemedText type="label" style={styles.sectionLabel}>
            KNOWLEDGE TREE
          </ThemedText>
          {subjects.length === 0 ? (
            <Card>
              <ThemedText style={{ textAlign: 'center', color: colors.muted }}>
                NO SUBJECTS YET. UPLOAD A SYLLABUS TO GET STARTED.
              </ThemedText>
            </Card>
          ) : (
            subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))
          )}
        </View>

        {/* Upload Syllabus Button */}
        <View style={styles.actions}>
          <Button
            title="+ UPLOAD SYLLABUS"
            variant="primary"
            onPress={() => router.push('/modals/upload-syllabus')}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  overview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Spacing.lg,
    borderBottomWidth: Borders.thin,
  },
  overviewStat: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  subjectList: {
    gap: Spacing.md,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  subjectCard: {
    gap: Spacing.sm,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorIndicator: {
    width: 4,
    height: 40,
  },
  subjectInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressContainer: {
    height: 8,
    borderWidth: Borders.thin,
    marginTop: Spacing.sm,
  },
  progressFill: {
    height: '100%',
  },
  topicList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: Borders.thin,
  },
  actions: {
    marginTop: Spacing.md,
  },
});
