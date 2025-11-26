import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Modal } from 'react-native';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

  // Get topic ID and all descendant IDs (for bulk select/deselect)
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

export default function AddExamModal() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { subjects, fetchSubjects, createAssessment } = useSyllabusStore();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [weightage, setWeightage] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Format date for display
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

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleToggleTopic = (id: string, allIds: string[]) => {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Deselect this and all descendants
        allIds.forEach((descendantId) => next.delete(descendantId));
      } else {
        // Select this and all descendants
        allIds.forEach((descendantId) => next.add(descendantId));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!title || !date || !weightage) {
      setError('ALL FIELDS ARE REQUIRED');
      return;
    }

    const parsedWeightage = parseInt(weightage, 10);
    if (isNaN(parsedWeightage) || parsedWeightage < 0 || parsedWeightage > 100) {
      setError('WEIGHTAGE MUST BE A NUMBER BETWEEN 0-100');
      return;
    }

    if (selectedTopicIds.size === 0) {
      setError('SELECT AT LEAST ONE TOPIC');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createAssessment({
        title,
        date,
        weightage: parsedWeightage,
        topicIds: Array.from(selectedTopicIds),
      });
      router.back();
    } catch {
      setError('FAILED TO CREATE EXAM');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">EXAM DETAILS</ThemedText>

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
                minDate={new Date().toISOString().split('T')[0]}
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
          title={isLoading ? 'CREATING...' : 'CREATE EXAM'}
          variant="primary"
          onPress={handleSubmit}
          disabled={isLoading}
        />
        <Button
          title="CANCEL"
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
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
  content: CommonStyles.modalContent,
  errorBox: CommonStyles.errorBox,
  section: CommonStyles.section,
  sectionLabel: {
    marginTop: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: Borders.regular,
  },
  modalOverlay: CommonStyles.modalOverlay,
  calendarContainer: CommonStyles.calendarModal,
  calendarHeader: CommonStyles.calendarHeader,
  calendarActions: CommonStyles.calendarActions,
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
