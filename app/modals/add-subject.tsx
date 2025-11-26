import { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Borders, Colors, Spacing, SubjectColors, Sizes, CommonStyles, DAYS_OF_WEEK, Layout } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';
import { isValidTime, normalizeTime } from '@/lib/time-utils';
import type { ClassSlot } from '@/lib/types';

export default function AddSubjectModal() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { createSubject } = useSyllabusStore();

  // Basic info
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SubjectColors[0]);

  // Schedule
  const [classSlots, setClassSlots] = useState<ClassSlot[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotDay, setNewSlotDay] = useState(1); // Monday
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');

  const [error, setError] = useState('');
  const [slotError, setSlotError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    setClassSlots([...classSlots, newSlot]);
    setShowAddSlot(false);
    setSlotError('');
    // Reset for next slot
    setNewSlotStart('09:00');
    setNewSlotEnd('10:00');
  };

  const handleRemoveSlot = (slotId: string) => {
    setClassSlots(classSlots.filter((s) => s.id !== slotId));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('SUBJECT NAME IS REQUIRED');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create the subject (passing schedule slots)
      const newSubject = await createSubject(name.trim(), selectedColor, classSlots);

      // Navigate to the new subject's page
      router.replace(`/subjects/${newSubject.id}`);
    } catch {
      setError('FAILED TO CREATE SUBJECT');
      setIsLoading(false);
    }
  };

  const formatSlotTime = (slot: ClassSlot) => {
    return `${slot.startTime} - ${slot.endTime}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText type="subtitle">NEW SUBJECT</ThemedText>

        {error ? (
          <View style={[styles.errorBox, { borderColor: colors.accent }]}>
            <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
          </View>
        ) : null}

        {/* Subject Name */}
        <Input
          label="SUBJECT NAME"
          placeholder="E.G. LINEAR ALGEBRA"
          value={name}
          onChangeText={setName}
          autoFocus
        />

        {/* Color Selection */}
        <View style={styles.section}>
          <ThemedText type="label">SELECT COLOR</ThemedText>
          <View style={styles.colorGrid}>
            {SubjectColors.map((color) => (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorOption,
                  {
                    backgroundColor: color,
                    borderColor: selectedColor === color ? colors.text : 'transparent',
                  },
                ]}
                accessibilityLabel={`Select color ${color}`}
                accessibilityRole="button"
              />
            ))}
          </View>
        </View>

        {/* Weekly Schedule (Optional) */}
        <View style={styles.section}>
          <ThemedText type="label">WEEKLY SCHEDULE (OPTIONAL)</ThemedText>
          <ThemedText style={{ color: colors.muted, marginBottom: Spacing.sm }}>
            ADD CLASS TIMES FOR THIS SUBJECT
          </ThemedText>

          {/* Existing slots */}
          {classSlots.length > 0 && (
            <View style={styles.slotsList}>
              {classSlots.map((slot) => (
                <View
                  key={slot.id}
                  style={[styles.slotItem, { borderColor: colors.border }]}
                >
                  <View style={styles.slotInfo}>
                    <ThemedText type="label">{DAYS_OF_WEEK[slot.dayOfWeek]}</ThemedText>
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

        {/* Preview */}
        <View style={styles.section}>
          <ThemedText type="label">PREVIEW</ThemedText>
          <View style={[styles.preview, { borderColor: colors.border }]}>
            <View style={[styles.previewIndicator, { backgroundColor: selectedColor }]} />
            <ThemedText type="subtitle">
              {name.trim() ? name.trim().toUpperCase() : 'SUBJECT NAME'}
            </ThemedText>
          </View>
        </View>
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
                {DAYS_OF_WEEK.map((day, index) => (
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
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Button
          title={isLoading ? 'CREATING...' : 'CREATE SUBJECT'}
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorBox: CommonStyles.errorBox,
  section: CommonStyles.section,
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: Borders.regular,
  },
  previewIndicator: CommonStyles.colorIndicatorSm,
  // Modal styles
  modalOverlay: CommonStyles.modalOverlay,
  modalContent: {
    width: '100%',
    maxWidth: Layout.modalMaxWidthLg,
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
  actions: CommonStyles.actionsFooter,
});
