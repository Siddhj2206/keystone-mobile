import { StyleSheet, View, Pressable } from 'react-native';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, Borders, Sizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Topic } from '@/lib/types';

type TopicRowProps = {
  topic: Topic;
  depth?: number;
  onPress?: (topic: Topic) => void;
};

function TopicRow({ topic, depth = 0, onPress }: TopicRowProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [expanded, setExpanded] = useState(false);
  const hasChildren = topic.children && topic.children.length > 0;

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 0.8) return colors.success;
    if (mastery >= 0.5) return colors.warning;
    return colors.accent;
  };

  const getStatusIcon = (status: Topic['status']) => {
    switch (status) {
      case 'completed':
        return '[X]';
      case 'needs_revision':
        return '[!]';
      default:
        return '[ ]';
    }
  };

  const handlePress = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else if (onPress) {
      onPress(topic);
    }
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.row,
          {
            paddingLeft: Spacing.md + depth * Spacing.md,
            backgroundColor: pressed ? colors.surface : 'transparent',
          },
        ]}
      >
        <View style={styles.rowLeft}>
          {hasChildren && (
            <ThemedText type="label" style={styles.expandIcon}>
              {expanded ? '[-]' : '[+]'}
            </ThemedText>
          )}
          <ThemedText type="label" style={{ color: colors.muted }}>
            {getStatusIcon(topic.status)}
          </ThemedText>
          <ThemedText style={styles.title} numberOfLines={1}>
            {topic.title}
          </ThemedText>
        </View>
        <View style={styles.rowRight}>
          <View style={[styles.masteryBar, { borderColor: colors.border }]}>
            <View
              style={[
                styles.masteryFill,
                {
                  width: `${topic.currentMastery * 100}%`,
                  backgroundColor: getMasteryColor(topic.currentMastery),
                },
              ]}
            />
          </View>
          <ThemedText type="label" style={styles.percentText}>
            {Math.round(topic.currentMastery * 100)}%
          </ThemedText>
        </View>
      </Pressable>

      {expanded && hasChildren && (
        <View style={styles.children}>
          {topic.children!.map((child) => (
            <TopicRow
              key={child.id}
              topic={child}
              depth={depth + 1}
              onPress={onPress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type TopicTreeProps = {
  topics: Topic[];
  onTopicPress?: (topic: Topic) => void;
};

export function TopicTree({ topics, onTopicPress }: TopicTreeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (topics.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={{ color: colors.muted }}>NO TOPICS YET</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {topics.map((topic) => (
        <TopicRow key={topic.id} topic={topic} onPress={onTopicPress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  empty: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    gap: Spacing.sm,
    minHeight: 44, // Minimum touch target
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  expandIcon: {
    width: 28,
    textAlign: 'center',
  },
  title: {
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  masteryBar: {
    width: Sizes.masteryBar,
    height: Sizes.progressBar,
    borderWidth: Borders.thin,
  },
  masteryFill: {
    height: '100%',
  },
  percentText: {
    width: Sizes.percentWidth,
    textAlign: 'right',
  },
  children: {
    // Children are indented via paddingLeft on each row
  },
});
