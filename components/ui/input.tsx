import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Borders, Colors, Fonts, Radius, Spacing, FontSizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Use label or placeholder as accessibility fallback
  const accessibilityLabel = label || props.placeholder;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="label" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.muted}
        accessibilityLabel={accessibilityLabel}
        {...props}
      />
      {error && (
        <ThemedText style={[styles.error, { color: colors.error }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    borderWidth: Borders.regular,
    borderRadius: Radius.none,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  error: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.mono,
  },
});
