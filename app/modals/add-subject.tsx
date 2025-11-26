import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Borders, Colors, Spacing, SubjectColors, Sizes, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';

export default function AddSubjectModal() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { createSubject } = useSyllabusStore();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SubjectColors[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('SUBJECT NAME IS REQUIRED');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newSubject = await createSubject(name.trim(), selectedColor);
      // Navigate to the new subject's page
      router.replace(`/subjects/${newSubject.id}`);
    } catch {
      setError('FAILED TO CREATE SUBJECT');
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle">NEW SUBJECT</ThemedText>
        <ThemedText style={{ color: colors.muted }}>
          CREATE A NEW SUBJECT TO TRACK YOUR PROGRESS
        </ThemedText>

        {error ? (
          <View style={[styles.errorBox, { borderColor: colors.accent }]}>
            <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
          </View>
        ) : null}

        <Input
          label="SUBJECT NAME"
          placeholder="E.G. LINEAR ALGEBRA"
          value={name}
          onChangeText={setName}
          autoFocus
        />

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
      </View>

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
  content: {
    flex: 1,
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
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: Borders.regular,
  },
  previewIndicator: {
    width: 4,
    height: 30,
  },
  actions: CommonStyles.actionsFooter,
});
