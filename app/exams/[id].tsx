import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Borders, Colors, Spacing, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import type { Topic } from '@/lib/types';

// Display topics as a tree (read-only)
function TopicDisplay({
  topic,
  depth = 0,
}: {
  topic: Topic;
  depth?: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const hasChildren = topic.children && topic.children.length > 0;

  return (
    <View>
      <View
        style={[
          styles.topicDisplayRow,
          { paddingLeft: Spacing.md + depth * Spacing.md },
        ]}
      >
        <ThemedText style={{ color: colors.muted }}>{depth > 0 ? '└ ' : '• '}</ThemedText>
        <ThemedText style={{ flex: 1 }}>{topic.title}</ThemedText>
      </View>
      {hasChildren && (
        <View>
          {topic.children!.map((child) => (
            <TopicDisplay
              key={child.id}
              topic={child}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ExamDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { subjects, assessments, fetchSubjects, fetchAssessments, getAssessmentById } = useSyllabusStore();

  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects();
    }
    if (assessments.length === 0) {
      fetchAssessments();
    }
  }, [subjects.length, assessments.length, fetchSubjects, fetchAssessments]);

  const assessment = getAssessmentById(id);
  const examSubject = subjects.find((s) => s.id === assessment?.subjectId);

  // Get topic details from IDs
  const getTopicsFromIds = useMemo(() => {
    if (!assessment || !examSubject) return [];

    const findTopics = (topics: Topic[], ids: string[]): Topic[] => {
      const result: Topic[] = [];
      for (const topic of topics) {
        if (ids.includes(topic.id)) {
          result.push(topic);
        }
        if (topic.children) {
          result.push(...findTopics(topic.children, ids));
        }
      }
      return result;
    };

    return findTopics(examSubject.topics, assessment.topicIds);
  }, [assessment, examSubject]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).toUpperCase();
  };

  if (!assessment) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText type="subtitle">EXAM NOT FOUND</ThemedText>
        <Button title="GO BACK" variant="outline" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const examDate = new Date(assessment.date);
  const now = new Date();
  const isUpcoming = examDate > now;
  const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const handleEdit = () => {
    router.push(`/modals/edit-exam?id=${id}`);
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

        {/* Exam Title */}
        <View style={styles.examHeader}>
          {examSubject && (
            <View style={[styles.colorBar, { backgroundColor: examSubject.colorHex }]} />
          )}
          <View style={styles.examHeaderInfo}>
            <ThemedText type="title">{assessment.title.toUpperCase()}</ThemedText>
            {examSubject && (
              <ThemedText type="label" style={{ color: colors.muted }}>
                {examSubject.name.toUpperCase()}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { borderColor: colors.border }]}>
          {isUpcoming ? (
            <ThemedText
              type="label"
              style={{ color: daysUntil <= 7 ? colors.accent : colors.text }}
            >
              {daysUntil === 0
                ? 'TODAY'
                : daysUntil === 1
                ? 'TOMORROW'
                : `${daysUntil} DAYS UNTIL EXAM`}
            </ThemedText>
          ) : (
            <ThemedText type="label" style={{ color: colors.muted }}>
              COMPLETED
            </ThemedText>
          )}
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
          <View style={styles.stat}>
            <ThemedText type="title">{assessment.weightage}%</ThemedText>
            <ThemedText type="label">WEIGHTAGE</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <ThemedText type="title">{assessment.topicIds.length}</ThemedText>
            <ThemedText type="label">TOPICS</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <ThemedText type="title">{formatDateDisplay(assessment.date).split(',')[0]}</ThemedText>
            <ThemedText type="label">{formatDateDisplay(assessment.date).split(', ').slice(1).join(', ')}</ThemedText>
          </View>
        </View>

        {/* Topics Section */}
        <View style={styles.section}>
          <ThemedText type="label" style={styles.sectionLabel}>
            TOPICS COVERED
          </ThemedText>
          {getTopicsFromIds.length === 0 ? (
            <Card>
              <ThemedText style={{ color: colors.muted, textAlign: 'center' }}>
                NO TOPICS ASSIGNED
              </ThemedText>
            </Card>
          ) : (
            <Card style={styles.topicsCard}>
              {getTopicsFromIds.map((topic) => (
                <TopicDisplay key={topic.id} topic={topic} />
              ))}
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
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorBar: CommonStyles.colorBar,
  examHeaderInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: Borders.regular,
  },
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
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    marginBottom: Spacing.xs,
  },
  topicsCard: {
    padding: Spacing.sm,
  },
  topicDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
});
