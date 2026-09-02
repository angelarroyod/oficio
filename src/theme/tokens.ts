/**
 * Design tokens — single source of truth for the Oficio look.
 *
 * Visual concept: "confianza a primera vista". A deep, calm blue carries the
 * institutional trust the category lacks; a warm copper accent carries the
 * trade itself (brick, tool steel, workshop light) and is spent sparingly on
 * money, urgency and the single next action on a screen.
 *
 * MVP ships a single light theme (app.json sets userInterfaceStyle: "light").
 * Colors are chosen for WCAG AA contrast: text on surface >= 7:1, white on
 * primary >= 4.5:1, semantic-on-tint pairs >= 4.5:1. Structured so a dark theme
 * can be added later behind `useTheme` without touching component code.
 */

export const palette = {
  // Brand — trust-forward blue, deepened for stronger contrast on white
  blue900: '#082A48',
  blue800: '#0A3D68',
  blue700: '#0F5FA6',
  blue600: '#2C7CC4',
  blue200: '#BFDCF3',
  blue100: '#E3EFFA',
  blue050: '#F2F8FD',

  // Accent — copper. The trade's own color: tools, brick, workshop light.
  copper700: '#A2521C',
  copper600: '#C2662A',
  copper500: '#E0873F',
  copper100: '#FBEADC',
  copper050: '#FDF6F0',

  // Neutrals — very slightly blue-cooled so they sit under the brand
  ink900: '#0D1219',
  ink800: '#1B242F',
  ink700: '#2A333D',
  ink500: '#5B6672',
  ink400: '#8A94A0',
  ink300: '#C6CDD5',
  ink200: '#E2E6EB',
  ink100: '#EDF0F4',
  ink050: '#F6F8FA',
  white: '#FFFFFF',

  // Semantic
  green700: '#1E7F4F',
  green100: '#E4F3EB',
  amber700: '#9A6510',
  amber100: '#FCF1DE',
  red700: '#B5342A',
  red100: '#FCEBE9',

  // Trade identity — one hue per oficio, used only in icon tiles and chips.
  violet700: '#5B4AB8',
  violet100: '#ECE9FB',
  teal700: '#0F7A73',
  teal100: '#DFF2F0',
  stone700: '#6B5A4B',
  stone100: '#F0EAE4',
} as const;

export const colors = {
  // Surfaces
  background: palette.ink050,
  surface: palette.white,
  surfaceMuted: palette.ink100,
  surfaceSunken: palette.ink200,
  border: palette.ink200,
  borderStrong: palette.ink300,

  // Text
  text: palette.ink900,
  textSecondary: palette.ink500,
  textTertiary: palette.ink400,
  textInverse: palette.white,
  textOnPrimary: palette.white,

  // Brand
  primary: palette.blue700,
  primaryDark: palette.blue800,
  primaryDeep: palette.blue900,
  primaryLight: palette.blue600,
  primaryTint: palette.blue100,
  primarySurface: palette.blue050,
  primaryBorder: palette.blue200,

  // Accent (copper) — money, urgency, the one hero action per screen
  accent: palette.copper700,
  accentLight: palette.copper500,
  accentTint: palette.copper100,
  accentSurface: palette.copper050,

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
  overlay: 'rgba(13, 18, 25, 0.55)',
  scrim: 'rgba(13, 18, 25, 0.06)',
} as const;

/**
 * Trade identity. Six oficios, six hues — a plumbing card is recognizable
 * before its label is read, which is the whole point of a scannable feed.
 */
export const tradeColors = {
  plumbing: { fg: palette.blue700, bg: palette.blue100 },
  electrical: { fg: palette.amber700, bg: palette.amber100 },
  masonry: { fg: palette.stone700, bg: palette.stone100 },
  carpentry: { fg: palette.copper700, bg: palette.copper100 },
  cleaning: { fg: palette.teal700, bg: palette.teal100 },
  installations: { fg: palette.violet700, bg: palette.violet100 },
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
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

/**
 * Type scale. sizes/lineHeights in px, weights as RN-accepted strings.
 * Uses the platform system font (SF Pro / Roboto) — no custom font load, so
 * startup stays instant and Expo Go needs no font assets. Tight letterSpacing
 * on the large steps is what makes a system font read as designed rather than
 * as default.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 },
  h1: { fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400', letterSpacing: 0 },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0 },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.8 },
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
  maxContentWidth: 560,
} as const;

/**
 * Elevation as CSS boxShadow strings — the only supported syntax on the New
 * Architecture; the legacy shadowColor/elevation props are deprecated there).
 */
export const elevation = {
  none: 'none',
  sm: '0px 1px 2px rgba(13, 18, 25, 0.06)',
  md: '0px 4px 14px rgba(13, 18, 25, 0.08)',
  lg: '0px 12px 28px rgba(13, 18, 25, 0.12)',
  primary: '0px 8px 20px rgba(15, 95, 166, 0.24)',
  accent: '0px 8px 20px rgba(162, 82, 28, 0.22)',
} as const;

/** Shared durations so every transition in the app feels related. */
export const motion = {
  fast: 140,
  base: 240,
  slow: 380,
} as const;

export type TypographyVariant = keyof typeof typography;
export type ColorToken = keyof typeof colors;
export type TradeColorKey = keyof typeof tradeColors;
