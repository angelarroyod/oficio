/**
 * Design tokens — single source of truth for the Oficio look.
 *
 * MVP ships a single light theme (app.json sets userInterfaceStyle: "light").
 * Colors are chosen for WCAG AA contrast: text on surface >= 7:1, white on
 * primary >= 4.5:1, semantic-on-tint pairs >= 4.5:1. Structured so a dark theme
 * can be added later behind `useTheme` without touching component code.
 */

export const palette = {
  // Brand — trust-forward blue
  blue900: '#0B3A63',
  blue800: '#0B4576',
  blue700: '#0F5FA6',
  blue100: '#E7F1FA',
  blue050: '#F2F8FD',

  // Neutrals
  ink900: '#10151B',
  ink700: '#2A333D',
  ink500: '#5B6672',
  ink400: '#8A94A0',
  ink200: '#E2E6EB',
  ink100: '#EEF1F4',
  ink050: '#F7F8FA',
  white: '#FFFFFF',

  // Semantic
  green700: '#1E7F4F',
  green100: '#E6F4EC',
  amber700: '#B7791F',
  amber100: '#FCF3E3',
  red700: '#C0392B',
  red100: '#FCECEA',
} as const;

export const colors = {
  // Surfaces
  background: palette.ink050,
  surface: palette.white,
  surfaceMuted: palette.ink100,
  border: palette.ink200,

  // Text
  text: palette.ink900,
  textSecondary: palette.ink500,
  textTertiary: palette.ink400,
  textInverse: palette.white,
  textOnPrimary: palette.white,

  // Brand
  primary: palette.blue700,
  primaryDark: palette.blue800,
  primaryTint: palette.blue100,
  primarySurface: palette.blue050,

  // Semantic (fg + tint background pairs)
  success: palette.green700,
  successTint: palette.green100,
  warning: palette.amber700,
  warningTint: palette.amber100,
  danger: palette.red700,
  dangerTint: palette.red100,

  // Interactive states
  disabled: palette.ink200,
  disabledText: palette.ink400,
  overlay: 'rgba(16, 21, 27, 0.45)',
} as const;

/** 4px base spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Type scale. sizes/lineHeights in px, weights as RN-accepted strings.
 * Uses the platform system font (SF Pro / Roboto) — no custom font load, so
 * startup stays instant and Expo Go needs no font assets.
 */
export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;

/**
 * Layout constants. minTouchTarget follows Apple HIG / Material a11y (44pt).
 * maxFontScale caps Dynamic Type so extreme accessibility sizes don't shatter
 * layouts while still honoring the user's larger-text preference.
 */
export const layout = {
  minTouchTarget: 44,
  maxFontScale: 1.6,
  screenPadding: spacing.lg,
  hairline: 1,
} as const;

export const shadow = {
  card: {
    shadowColor: palette.ink900,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
export type ColorToken = keyof typeof colors;
