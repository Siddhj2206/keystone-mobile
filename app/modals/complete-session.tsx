import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Borders, Colors, Spacing, Sizes, CommonStyles } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useScheduleStore } from '@/stores/use-schedule-store';

export default function CompleteSessionModal() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const { sessions, markComplete } = useScheduleStore();

  const session = sessions.find((s) => s.id === sessionId);

  // Calculate scheduled duration
  const scheduledMinutes = session
    ? Math.round(
        (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000
      )
    : 60;

  // Initialize with scheduledMinutes directly - no useEffect needed
  const [actualMinutes, setActualMinutes] = useState(() => scheduledMinutes);
  const [needsMoreTime, setNeedsMoreTime] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState('30');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!session) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">SESSION NOT FOUND</ThemedText>
        <Button title="GO BACK" variant="outline" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const handleSubmit = async () => {
    if (needsMoreTime) {
      const parsedRemaining = parseInt(remainingMinutes, 10);
      if (isNaN(parsedRemaining) || parsedRemaining <= 0) {
        setError('REMAINING TIME MUST BE A POSITIVE NUMBER');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      await markComplete(session.id, {
        actualMinutes,
        needsMoreTime,
        remainingMinutes: needsMoreTime ? parseInt(remainingMinutes, 10) : undefined,
      });
      router.back();
    } catch {
      setError('FAILED TO COMPLETE SESSION');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="subtitle">COMPLETE SESSION</ThemedText>

        {error ? (
          <View style={[styles.errorBox, { borderColor: colors.accent }]}>
            <ThemedText style={{ color: colors.accent }}>{error}</ThemedText>
          </View>
        ) : null}

        {/* Session Info */}
        <Card>
          <ThemedText type="label" style={{ color: colors.muted }}>
            TOPIC
          </ThemedText>
          <ThemedText type="subtitle">{session.topicTitle.toUpperCase()}</ThemedText>
          <ThemedText type="label" style={{ color: colors.muted, marginTop: Spacing.sm }}>
            SCHEDULED: {scheduledMinutes} MIN
          </ThemedText>
        </Card>

        {/* Time Spent Slider */}
        <View style={styles.section}>
          <ThemedText type="label">TIME SPENT: {actualMinutes} MIN</ThemedText>
          <View style={[styles.sliderContainer, { borderColor: colors.border }]}>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={Math.max(scheduledMinutes * 2, 120)}
              step={5}
              value={actualMinutes}
              onValueChange={setActualMinutes}
              minimumTrackTintColor={colors.text}
              maximumTrackTintColor={colors.muted}
              thumbTintColor={colors.text}
            />
          </View>
        </View>

        {/* Needs More Time Toggle */}
        <View style={styles.section}>
          <ThemedText type="label">DID YOU FINISH?</ThemedText>
          <View style={styles.toggleRow}>
            <Button
              title="YES, DONE"
              variant={!needsMoreTime ? 'primary' : 'outline'}
              onPress={() => setNeedsMoreTime(false)}
              style={styles.toggleButton}
            />
            <Button
              title="NEED MORE TIME"
              variant={needsMoreTime ? 'primary' : 'outline'}
              onPress={() => setNeedsMoreTime(true)}
              style={styles.toggleButton}
            />
          </View>
        </View>

        {/* Remaining Time Input */}
        {needsMoreTime && (
          <Input
            label="ESTIMATED TIME REMAINING (MIN)"
            placeholder="30"
            value={remainingMinutes}
            onChangeText={setRemainingMinutes}
            keyboardType="numeric"
          />
        )}
      </View>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <Button
          title={isLoading ? 'SAVING...' : 'MARK COMPLETE'}
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
  sliderContainer: {
    borderWidth: Borders.regular,
    padding: Spacing.sm,
  },
  slider: {
    width: '100%',
    height: Sizes.slider,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
  },
  actions: CommonStyles.actionsFooter,
});
