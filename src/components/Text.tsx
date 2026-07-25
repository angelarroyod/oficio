import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { theme, type ColorToken, type TypographyVariant } from '@/theme';

type Props = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  center?: boolean;
};

/**
 * Typed text primitive. Every text in the app should go through this so the
 * Dynamic Type cap (layout.maxFontScale) and color tokens apply consistently.
 */
export function Text({
  variant = 'body',
  color = 'text',
  center = false,
  style,
  maxFontSizeMultiplier,
  ...rest
}: Props) {
  const scale = theme.typography[variant];
  const base: TextStyle = {
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    fontWeight: scale.fontWeight,
    color: theme.colors[color],
    ...(center ? { textAlign: 'center' } : null),
  };
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? theme.layout.maxFontScale}
      style={[base, style]}
      {...rest}
    />
  );
}
