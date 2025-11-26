import { StyleSheet, View, type ViewProps } from 'react-native';

import { Borders, Colors, Radius, Spacing, Sizes } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type CardProps = ViewProps & {
  variant?: 'default' | 'elevated';
};

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        variant === 'elevated' && [styles.elevated, { shadowColor: colors.shadow }],
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: Borders.thick,
    borderRadius: Radius.none,
    padding: Spacing.md,
  },
  elevated: {
    // Hard drop shadow for brutalist aesthetic
    // iOS shadow
    shadowOffset: { width: Sizes.colorDot / 3, height: Sizes.colorDot / 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    // Android elevation
    elevation: 4,
  },
});
