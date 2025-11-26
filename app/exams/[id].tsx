import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Borders, Colors, Spacing, Fonts, Layout, CommonStyles, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import type { Topic } from '@/lib/types';

// Recursive checkbox for topic selection
function TopicCheckbox({
  topic,
  selectedIds,
  onToggle,
  depth = 0,
}: {
  topic: Topic;
  selectedIds: Set<string>;
  onToggle: (id: string, allDescendantIds: string[]) => void;
  depth?: number;
}) {
  const isSelected = selectedIds.has(topic.id);
  const hasChildren = topic.children && topic.children.length > 0;

  const getTopicAndDescendantIds = (t: Topic): string[] => {
    const ids = [t.id];
    if (t.children) {
      t.children.forEach((child) => {
        ids.push(...getTopicAndDescendantIds(child));
      });
    }
    return ids;
  };

  const handleToggle = () => {
    onToggle(topic.id, getTopicAndDescendantIds(topic));
  };

  return (
    <View>
      <Pressable
        onPress={handleToggle}
        style={[
          styles.checkboxRow,
          { paddingLeft: Spacing.md + depth * Spacing.md },
        ]}
      >
        <ThemedText type="label">
          {isSelected ? '[X]' : '[ ]'}
        </ThemedText>
        <ThemedText style={{ flex: 1 }}>{topic.title}</ThemedText>
      </Pressable>
      {hasChildren && (
        <View>
          {topic.children!.map((child) => (
            <TopicCheckbox
              key={child.id}
              topic={child}
              selectedIds={selectedIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

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

  const { subjects, assessments, fetchSubjects, fetchAssessments, getAssessmentById, updateAssessment } = useSyllabusStore();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [weightage, setWeightage] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects();
    }
    if (assessments.length === 0) {
      fetchAssessments();
    }
  }, [subjects.length, assessments.length, fetchSubjects, fetchAssessments]);

  const assessment = getAssessmentById(id);

  // Initialize edit form when assessment loads or edit mode starts
  useEffect(() => {
    if (assessment && isEditing) {
      setTitle(assessment.title);
      setDate(assessment.date.split('T')[0]);
      setWeightage(assessment.weightage.toString());
      setSelectedSubjectId(assessment.subjectId);
      setSelectedTopicIds(new Set(assessment.topicIds));
    }
  }, [assessment, isEditing]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
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

  const handleToggleTopic = (topicId: string, allIds: string[]) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        allIds.forEach((descendantId) => next.delete(descendantId));
      } else {
        allIds.forEach((descendantId) => next.add(descendantId));
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!title || !date || !weightage) {
      setError('ALL FIELDS ARE REQUIRED');
      return;
    }

    const parsedWeightage = parseInt(weightage, 10);
    if (isNaN(parsedWeightage) || parsedWeightage < 0 || parsedWeightage > 100) {
      setError('WEIGHTAGE MUST BE 0-100');
      return;
    }

    if (selectedTopicIds.size === 0) {
      setError('SELECT AT LEAST ONE TOPIC');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await updateAssessment(id, {
        title,
        date,
        weightage: parsedWeightage,
        topicIds: Array.from(selectedTopicIds),
        subjectId: selectedSubjectId || '',
      });
      setIsEditing(false);
    } catch {
      setError('FAILED TO UPDATE EXAM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
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

  // Edit Mode
  if (isEditing) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.sm }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleCancelEdit} hitSlop={8}>
              <ThemedText type="label">{'< CANCEL'}</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="title">EDIT EXAM</ThemedText>

          {error ? (
            <View style={[styles.errorBox, { borderColor: colors.accent }]}>
              <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
            </View>
          ) : null}

          <Input
            label="EXAM TITLE"
            placeholder="E.G. MIDTERM EXAM"
            value={title}
            onChangeText={setTitle}
          />

          {/* Date Picker */}
          <View style={styles.section}>
            <ThemedText type="label">DATE</ThemedText>
            <Pressable
              onPress={() => setShowCalendar(true)}
              style={[
                styles.dateButton,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <ThemedText style={!date ? { opacity: 0.5 } : undefined}>
                {date ? formatDateDisplay(date) : 'SELECT DATE'}
              </ThemedText>
              <ThemedText type="label">[CAL]</ThemedText>
            </Pressable>
          </View>

          {/* Calendar Modal */}
          <Modal
            visible={showCalendar}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCalendar(false)}
          >
            <Pressable
              style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
              onPress={() => setShowCalendar(false)}
            >
              <Pressable
                style={[
                  styles.calendarContainer,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={[styles.calendarHeader, { borderBottomColor: colors.border }]}>
                  <ThemedText type="label">SELECT EXAM DATE</ThemedText>
                </View>
                <Calendar
                  current={date || undefined}
                  onDayPress={(day: { dateString: string }) => {
                    setDate(day.dateString);
                    setShowCalendar(false);
                  }}
                  markedDates={
                    date
                      ? {
                          [date]: {
                            selected: true,
                            selectedColor: colors.text,
                          },
                        }
                      : {}
                  }
                  theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.background,
                    textSectionTitleColor: colors.text,
                    selectedDayBackgroundColor: colors.text,
                    selectedDayTextColor: colors.background,
                    todayTextColor: colors.accent,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.muted,
                    arrowColor: colors.text,
                    monthTextColor: colors.text,
                    textDayFontFamily: Fonts.mono,
                    textMonthFontFamily: Fonts.mono,
                    textDayHeaderFontFamily: Fonts.mono,
                    textDayFontSize: FontSizes.md,
                    textMonthFontSize: FontSizes.lg,
                    textDayHeaderFontSize: FontSizes.sm,
                  }}
                />
                <View style={styles.calendarActions}>
                  <Button
                    title="CLOSE"
                    variant="ghost"
                    onPress={() => setShowCalendar(false)}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <Input
            label="WEIGHTAGE (%)"
            placeholder="0-100"
            value={weightage}
            onChangeText={setWeightage}
            keyboardType="numeric"
          />

          {/* Subject Selector */}
          <View style={styles.section}>
            <ThemedText type="label" style={styles.sectionLabel}>
              SELECT SUBJECT
            </ThemedText>
            <View style={styles.subjectList}>
              {subjects.map((subject) => (
                <Pressable
                  key={subject.id}
                  onPress={() => {
                    setSelectedSubjectId(subject.id);
                    setSelectedTopicIds(new Set());
                  }}
                  style={[
                    styles.subjectButton,
                    {
                      borderColor: selectedSubjectId === subject.id ? subject.colorHex : colors.border,
                      backgroundColor: selectedSubjectId === subject.id ? colors.surface : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: subject.colorHex }]} />
                  <ThemedText>{subject.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Topic Selector */}
          {selectedSubject && (
            <View style={styles.section}>
              <ThemedText type="label" style={styles.sectionLabel}>
                SELECT TOPICS ({selectedTopicIds.size} SELECTED)
              </ThemedText>
              <View style={[styles.topicList, { borderColor: colors.border }]}>
                {selectedSubject.topics.map((topic) => (
                  <TopicCheckbox
                    key={topic.id}
                    topic={topic}
                    selectedIds={selectedTopicIds}
                    onToggle={handleToggleTopic}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Button
            title={isLoading ? 'SAVING...' : 'SAVE CHANGES'}
            variant="primary"
            onPress={handleSave}
            disabled={isLoading}
          />
        </View>
      </ThemedView>
    );
  }

  // View Mode
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
          <Pressable onPress={() => setIsEditing(true)} hitSlop={8}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorBar: {
    width: 6,
    height: 50,
  },
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
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: Borders.thin,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
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
  // Edit mode styles
  errorBox: CommonStyles.errorBox,
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: Borders.regular,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: Layout.modalMaxWidth,
    borderWidth: Borders.thick,
  },
  calendarHeader: {
    padding: Spacing.md,
    borderBottomWidth: Borders.thin,
  },
  calendarActions: {
    padding: Spacing.md,
    borderTopWidth: Borders.thin,
  },
  subjectList: {
    gap: Spacing.sm,
  },
  subjectButton: CommonStyles.selectorButton,
  colorDot: CommonStyles.colorDot,
  topicList: {
    borderWidth: Borders.regular,
    maxHeight: Layout.listMaxHeight,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  actions: CommonStyles.actionsFooter,
});
