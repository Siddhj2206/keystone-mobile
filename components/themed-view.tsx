import { View, type ViewProps } from 'react-native';

import { Borders, Radius } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'surface' | 'bordered' | 'card';
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  const variantStyles = {
    default: { backgroundColor },
    surface: { backgroundColor: surfaceColor },
    bordered: {
      backgroundColor,
      borderWidth: Borders.regular,
      borderColor,
      borderRadius: Radius.none,
    },
    card: {
      backgroundColor: surfaceColor,
      borderWidth: Borders.thick,
      borderColor,
      borderRadius: Radius.none,
    },
  };

  return <View style={[variantStyles[variant], style]} {...otherProps} />;
}
