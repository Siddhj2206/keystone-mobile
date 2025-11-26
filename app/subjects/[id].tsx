import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopicTree } from '@/components/syllabus/topic-tree';
import { Borders, Colors, Spacing, SubjectColors, Sizes, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import { useScheduleStore } from '@/stores/use-schedule-store';
import type { Topic, ClassSlot } from '@/lib/types';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Validate time format HH:MM
const isValidTime = (time: string): boolean => {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

// Normalize time to HH:MM format
const normalizeTime = (time: string): string => {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

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

  const { subjects, fetchSubjects, getSubjectById, updateSubject } = useSyllabusStore();
  const { sessions } = useScheduleStore();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editClassSlots, setEditClassSlots] = useState<ClassSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Add slot modal
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState(1);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');
  const [slotError, setSlotError] = useState('');

  useEffect(() => {
    if (subjects.length === 0) {
      fetchSubjects();
    }
  }, [subjects.length, fetchSubjects]);

  const subject = getSubjectById(id);

  // Initialize edit state when subject loads or changes
  useEffect(() => {
    if (subject) {
      setEditName(subject.name);
      setEditColor(subject.colorHex);
      setEditClassSlots(subject.classSlots ?? []);
    }
  }, [subject]);

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

  // Edit mode handlers
  const handleStartEdit = () => {
    setEditName(subject?.name ?? '');
    setEditColor(subject?.colorHex ?? SubjectColors[0]);
    setEditClassSlots(subject?.classSlots ?? []);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(subject?.name ?? '');
    setEditColor(subject?.colorHex ?? SubjectColors[0]);
    setEditClassSlots(subject?.classSlots ?? []);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await updateSubject(id, {
        name: editName.trim(),
        colorHex: editColor,
        classSlots: editClassSlots,
      });
      setIsEditing(false);
    } catch {
      // Error handled by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSlot = () => {
    if (!isValidTime(newSlotStart)) {
      setSlotError('INVALID START TIME (USE HH:MM)');
      return;
    }
    if (!isValidTime(newSlotEnd)) {
      setSlotError('INVALID END TIME (USE HH:MM)');
      return;
    }

    const normalizedStart = normalizeTime(newSlotStart);
    const normalizedEnd = normalizeTime(newSlotEnd);

    if (normalizedStart >= normalizedEnd) {
      setSlotError('END TIME MUST BE AFTER START TIME');
      return;
    }

    const newSlot: ClassSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: newSlotDay,
      startTime: normalizedStart,
      endTime: normalizedEnd,
    };

    setEditClassSlots([...editClassSlots, newSlot]);
    setShowAddSlot(false);
    setSlotError('');
    setNewSlotStart('09:00');
    setNewSlotEnd('10:00');
  };

  const handleRemoveSlot = (slotId: string) => {
    setEditClassSlots(editClassSlots.filter((s) => s.id !== slotId));
  };

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
          {!isEditing && (
            <Pressable onPress={handleStartEdit} hitSlop={8}>
              <ThemedText type="label">[EDIT]</ThemedText>
            </Pressable>
          )}
        </View>

        {isEditing ? (
          // EDIT MODE
          <>
            {/* Edit Name */}
            <Input
              label="SUBJECT NAME"
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />

            {/* Edit Color */}
            <View style={styles.section}>
              <ThemedText type="label">COLOR</ThemedText>
              <View style={styles.colorGrid}>
                {SubjectColors.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setEditColor(color)}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: color,
                        borderColor: editColor === color ? colors.text : 'transparent',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Edit Class Schedule */}
            <View style={styles.section}>
              <ThemedText type="label">WEEKLY SCHEDULE</ThemedText>
              <ThemedText style={{ color: colors.muted, marginBottom: Spacing.sm }}>
                CLASS TIMES FOR THIS SUBJECT
              </ThemedText>

              {editClassSlots.length > 0 && (
                <View style={styles.slotsList}>
                  {editClassSlots.map((slot) => (
                    <View
                      key={slot.id}
                      style={[styles.slotItem, { borderColor: colors.border }]}
                    >
                      <View style={styles.slotInfo}>
                        <ThemedText type="label">{DAYS[slot.dayOfWeek]}</ThemedText>
                        <ThemedText>{formatSlotTime(slot)}</ThemedText>
                      </View>
                      <Pressable onPress={() => handleRemoveSlot(slot.id)} hitSlop={8}>
                        <ThemedText type="label">[X]</ThemedText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              <Button
                title="+ ADD CLASS TIME"
                variant="outline"
                onPress={() => setShowAddSlot(true)}
              />
            </View>
          </>
        ) : (
          // VIEW MODE
          <>
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

            {/* Class Schedule (View) */}
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
                      <ThemedText type="label">{DAYS[slot.dayOfWeek]}</ThemedText>
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
          </>
        )}
      </ScrollView>

      {/* Add Slot Modal */}
      <Modal
        visible={showAddSlot}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSlot(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowAddSlot(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <ThemedText type="subtitle">ADD CLASS TIME</ThemedText>

            {/* Day Selection */}
            <View style={styles.section}>
              <ThemedText type="label">DAY</ThemedText>
              <View style={styles.dayGrid}>
                {DAYS.map((day, index) => (
                  <Pressable
                    key={day}
                    onPress={() => setNewSlotDay(index)}
                    style={[
                      styles.dayButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: newSlotDay === index ? colors.text : 'transparent',
                      },
                    ]}
                  >
                    <ThemedText
                      type="label"
                      style={{ color: newSlotDay === index ? colors.background : colors.text }}
                    >
                      {day}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Time Selection */}
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Input
                  label="START"
                  placeholder="HH:MM"
                  value={newSlotStart}
                  onChangeText={setNewSlotStart}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.timeField}>
                <Input
                  label="END"
                  placeholder="HH:MM"
                  value={newSlotEnd}
                  onChangeText={setNewSlotEnd}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {slotError ? (
              <ThemedText style={{ color: colors.accent }}>{slotError}</ThemedText>
            ) : null}

            <View style={styles.modalActions}>
              <Button title="ADD" variant="primary" onPress={handleAddSlot} />
              <Button title="CANCEL" variant="ghost" onPress={() => { setShowAddSlot(false); setSlotError(''); }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Actions */}
      {isEditing && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Button
            title={isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            variant="primary"
            onPress={handleSaveEdit}
            disabled={isSaving || !editName.trim()}
          />
          <Button
            title="CANCEL"
            variant="ghost"
            onPress={handleCancelEdit}
          />
        </View>
      )}
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
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorBar: {
    width: 6,
    height: 50,
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  progressContainer: {
    height: 12,
    borderWidth: Borders.regular,
  },
  progressFill: {
    height: '100%',
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
  section: CommonStyles.section,
  sectionLabel: {
    marginBottom: Spacing.xs,
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
  actions: CommonStyles.actionsFooter,
  // Edit mode styles
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: Sizes.colorSwatch,
    height: Sizes.colorSwatch,
    borderWidth: Borders.thick,
  },
  slotsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: Borders.thick,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  dayButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: Borders.regular,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeField: {
    flex: 1,
  },
  modalActions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
