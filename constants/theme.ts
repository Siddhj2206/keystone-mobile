/**
 * Brutalist Monospace Design System
 * High contrast, sharp edges, monospace typography
 */

import { Platform, StyleSheet } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: '#000000',
    icon: '#000000',
    tabIconDefault: '#666666',
    tabIconSelected: '#000000',
    border: '#000000',
    surface: '#F5F5F5',
    accent: '#0000FF',
    muted: '#666666',
    success: '#00AA00',
    warning: '#FFAA00',
    error: '#FF0000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: '#000000',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: '#FFFFFF',
    icon: '#FFFFFF',
    tabIconDefault: '#888888',
    tabIconSelected: '#FFFFFF',
    border: '#FFFFFF',
    surface: '#111111',
    accent: '#00FF00',
    muted: '#888888',
    success: '#00FF00',
    warning: '#FFCC00',
    error: '#FF3333',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000',
  },
};

// Subject color palette for syllabus
export const SubjectColors = [
  '#FF0000', '#00AA00', '#0000FF', '#FF6600',
  '#AA00AA', '#00AAAA', '#AAAA00', '#FF00FF',
] as const;

// Days of week for schedule UI
export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

// Brutalist spacing system (multiples of 8, with xs exception)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border widths for brutalist aesthetic
export const Borders = {
  thin: 1,
  regular: 2,
  thick: 3,
  heavy: 4,
} as const;

// Sharp corners or minimal rounding
export const Radius = {
  none: 0,
  minimal: 2,
  small: 4,
} as const;

// Font sizes
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
} as const;

// Line heights
export const LineHeights = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 26,
  xl: 32,
} as const;

// Letter spacing
export const LetterSpacing = {
  tight: 0.5,
  normal: 1,
  medium: 1.5,
  wide: 2,
  extraWide: 8,
} as const;

// Icon sizes
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 18,
  lg: 24,
  xl: 32,
} as const;

// Fixed component sizes
export const Sizes = {
  colorDot: 12,
  colorSwatch: 40,
  progressBar: 8,
  progressBarLg: 12,
  slider: 40,
  masteryBar: 60,
  percentWidth: 40,
  touchTarget: 44,
  colorBarWidth: 6,
  colorBarHeight: 50,
  colorIndicatorWidth: 4,
  colorIndicatorHeightSm: 30,
  colorIndicatorHeightMd: 40,
  expandIconWidth: 28,
  waveEmoji: 28,
} as const;

// Layout constants
export const Layout = {
  modalMaxWidth: 360,
  modalMaxWidthLg: 400,
  listMaxHeight: 300,
  headerHeight: 250,
} as const;

// Opacity values
export const Opacity = {
  muted: 0.6,
  pressed: 0.8,
  disabled: 0.5,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Shared styles for common patterns
export const CommonStyles = StyleSheet.create({
  // Layout
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Containers
  screenContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Section
  section: {
    gap: Spacing.sm,
  },

  // Error box
  errorBox: {
    borderWidth: Borders.regular,
    padding: Spacing.sm,
  },

  // Actions footer
  actionsFooter: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: Borders.thin,
  },

  // Header row (spaceBetween pattern)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Spacing.lg,
    borderBottomWidth: Borders.thin,
  },
  stat: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: Borders.thin,
    alignSelf: 'stretch',
  },

  // Color dot indicator
  colorDot: {
    width: Sizes.colorDot,
    height: Sizes.colorDot,
  },

  // Vertical color bar
  colorBar: {
    width: Sizes.colorBarWidth,
    height: Sizes.colorBarHeight,
  },

  // Small color indicator
  colorIndicator: {
    width: Sizes.colorIndicatorWidth,
    height: Sizes.colorIndicatorHeightMd,
  },
  colorIndicatorSm: {
    width: Sizes.colorIndicatorWidth,
    height: Sizes.colorIndicatorHeightSm,
  },

  // Divider
  dividerLine: {
    flex: 1,
    height: Borders.thin,
  },

  // Progress bar
  progressBarContainer: {
    height: Sizes.progressBar,
    borderWidth: Borders.thin,
  },
  progressBarContainerLg: {
    height: Sizes.progressBarLg,
    borderWidth: Borders.thin,
  },
  progressBarFill: {
    height: '100%',
  },

  // Selector button (subjects, colors)
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: Borders.regular,
  },

  // Loading/Empty containers
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },

  // Calendar modal
  calendarModal: {
    width: '100%',
    maxWidth: Layout.modalMaxWidth,
    borderWidth: Borders.thick,
  },
  calendarHeader: {
    padding: Spacing.md,
    borderBottomWidth: Borders.thin,
  },
  calendarActions: {
    padding: Spacing.md,
    borderTopWidth: Borders.thin,
  },

  // Touch target (min 44px)
  touchTarget: {
    minWidth: Sizes.touchTarget,
    minHeight: Sizes.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Header styles for navigation
export const HeaderStyles = {
  title: {
    fontFamily: Fonts.mono,
    fontWeight: '700' as const,
    fontSize: FontSizes.xl,
    textTransform: 'uppercase' as const,
    letterSpacing: LetterSpacing.wide,
  },
  backTitle: {
    fontFamily: Fonts.mono,
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: LetterSpacing.normal,
  },
};
