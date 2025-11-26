import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, FontSizes, LineHeights, LetterSpacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'label' | 'mono' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        styles.base,
        { color },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'label' && styles.label,
        type === 'mono' && styles.mono,
        type === 'link' && styles.link,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.mono,
  },
  default: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    lineHeight: LineHeights.xl,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
  },
  subtitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    lineHeight: LineHeights.lg,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.normal,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    lineHeight: LineHeights.xs,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.medium,
  },
  mono: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.sm,
  },
  link: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
});
