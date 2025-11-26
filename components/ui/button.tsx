import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Borders, Colors, Fonts, Radius, Spacing, FontSizes, LetterSpacing, Opacity } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  style,
  disabled,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const sizeStyles = {
    sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
    md: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };

  const textColor = variant === 'primary' ? colors.background : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <ThemedText
        style={[
          styles.text,
          { color: textColor },
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: Borders.regular,
    borderRadius: Radius.none,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: Opacity.pressed,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    opacity: Opacity.disabled,
  },
  text: {
    fontFamily: Fonts.mono,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.medium,
    fontSize: FontSizes.md,
  },
  textSm: {
    fontSize: FontSizes.sm,
  },
  textLg: {
    fontSize: FontSizes.lg,
  },
});
