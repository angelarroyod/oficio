import {
  colors,
  elevation,
  layout,
  motion,
  radius,
  spacing,
  tradeColors,
  typography,
} from './tokens';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  layout,
  elevation,
  motion,
  tradeColors,
} as const;

export type Theme = typeof theme;

/**
 * Single-theme accessor for the MVP. Kept as a hook so screens depend on an API,
 * not on module-level constants — a dark theme can be introduced later by making
 * this read from a context/store with zero changes at call sites.
 */
export function useTheme(): Theme {
  return theme;
}

export * from './tokens';
