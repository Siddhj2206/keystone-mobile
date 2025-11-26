import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Borders, Colors, Spacing, SubjectColors, Sizes, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSyllabusStore } from '@/stores/use-syllabus-store';

export default function UploadSyllabusModal() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { subjectId: initialSubjectId } = useLocalSearchParams<{ subjectId?: string }>();

  const { subjects, fetchSubjects, createSubject, uploadSyllabus } = useSyllabusStore();

  // If subjectId is provided, skip subject selection
  const hasPreselectedSubject = !!initialSubjectId;
  const [mode, setMode] = useState<'select' | 'create'>(hasPreselectedSubject ? 'select' : 'select');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(initialSubjectId ?? null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SubjectColors[0]);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
        });
      }
    } catch {
      setError('FAILED TO PICK DOCUMENT');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('SELECT A PDF FILE');
      return;
    }

    let subjectId = selectedSubjectId;

    setIsLoading(true);
    setError('');

    try {
      // Create new subject if needed
      if (mode === 'create') {
        if (!newSubjectName) {
          setError('ENTER A SUBJECT NAME');
          setIsLoading(false);
          return;
        }
        const newSubject = await createSubject(newSubjectName, selectedColor);
        subjectId = newSubject.id;
      }

      if (!subjectId) {
        setError('SELECT OR CREATE A SUBJECT');
        setIsLoading(false);
        return;
      }

      // Upload syllabus
      await uploadSyllabus(subjectId, selectedFile.uri, selectedFile.name);
      router.back();
    } catch {
      setError('FAILED TO UPLOAD SYLLABUS');
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
        <ThemedText type="subtitle">UPLOAD SYLLABUS PDF</ThemedText>
        <ThemedText style={{ color: colors.muted }}>
          UPLOAD A PDF SYLLABUS TO AUTOMATICALLY GENERATE YOUR TOPIC TREE
        </ThemedText>

        {error ? (
          <View style={[styles.errorBox, { borderColor: colors.accent }]}>
            <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
          </View>
        ) : null}

        {/* Show preselected subject or mode toggle */}
        {hasPreselectedSubject ? (
          <View style={styles.section}>
            <ThemedText type="label">SUBJECT</ThemedText>
            {subjects.find((s) => s.id === initialSubjectId) && (
              <View
                style={[
                  styles.subjectButton,
                  {
                    borderColor: subjects.find((s) => s.id === initialSubjectId)?.colorHex,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: subjects.find((s) => s.id === initialSubjectId)?.colorHex },
                  ]}
                />
                <ThemedText>{subjects.find((s) => s.id === initialSubjectId)?.name}</ThemedText>
              </View>
            )}
          </View>
        ) : (
          /* Mode Toggle */
          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => setMode('select')}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.border,
                  backgroundColor: mode === 'select' ? colors.text : 'transparent',
                },
              ]}
            >
              <ThemedText style={{ color: mode === 'select' ? colors.background : colors.text }}>
                EXISTING
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('create')}
              style={[
                styles.modeButton,
                {
                  borderColor: colors.border,
                  backgroundColor: mode === 'create' ? colors.text : 'transparent',
                },
              ]}
            >
              <ThemedText style={{ color: mode === 'create' ? colors.background : colors.text }}>
                NEW SUBJECT
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Existing Subject Selection - only show if no preselected subject */}
        {!hasPreselectedSubject && mode === 'select' && (
          <View style={styles.section}>
            <ThemedText type="label">SELECT SUBJECT</ThemedText>
            <View style={styles.subjectList}>
              {subjects.length === 0 ? (
                <ThemedText style={{ color: colors.muted }}>
                  NO SUBJECTS YET. CREATE ONE FIRST.
                </ThemedText>
              ) : (
                subjects.map((subject) => (
                  <Pressable
                    key={subject.id}
                    onPress={() => setSelectedSubjectId(subject.id)}
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
                ))
              )}
            </View>
          </View>
        )}

        {/* New Subject Form - only show if no preselected subject */}
        {!hasPreselectedSubject && mode === 'create' && (
          <View style={styles.section}>
            <Input
              label="SUBJECT NAME"
              placeholder="E.G. LINEAR ALGEBRA"
              value={newSubjectName}
              onChangeText={setNewSubjectName}
            />
            <ThemedText type="label" style={{ marginTop: Spacing.sm }}>
              SELECT COLOR
            </ThemedText>
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
                />
              ))}
            </View>
          </View>
        )}

        {/* File Picker */}
        <View style={styles.section}>
          <ThemedText type="label">PDF FILE</ThemedText>
          {selectedFile ? (
            <Card style={styles.fileCard}>
              <ThemedText numberOfLines={1}>{selectedFile.name}</ThemedText>
              <Button
                title="CHANGE"
                variant="ghost"
                size="sm"
                onPress={handlePickDocument}
              />
            </Card>
          ) : (
            <Button
              title="SELECT PDF FILE"
              variant="outline"
              onPress={handlePickDocument}
            />
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Button
          title={isLoading ? 'UPLOADING...' : 'UPLOAD SYLLABUS'}
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
  modeToggle: {
    flexDirection: 'row',
    gap: 0,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: Borders.regular,
  },
  section: CommonStyles.section,
  subjectList: {
    gap: Spacing.sm,
  },
  subjectButton: CommonStyles.selectorButton,
  colorDot: CommonStyles.colorDot,
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
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: CommonStyles.actionsFooter,
});
