import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const containerByVariant: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: theme.colors.primary, boxShadow: theme.elevation.primary },
  accent: { backgroundColor: theme.colors.accent, boxShadow: theme.elevation.accent },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.primaryBorder,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: theme.colors.danger },
};

const textColorByVariant: Record<Variant, Parameters<typeof Text>[0]['color']> = {
  primary: 'textOnPrimary',
  accent: 'textOnPrimary',
  secondary: 'primary',
  ghost: 'primary',
  danger: 'textOnPrimary',
};

const bySize: Record<Size, { height: number; text: 'title' | 'label'; px: number }> = {
  sm: { height: 36, text: 'label', px: theme.spacing.md },
  md: { height: theme.layout.minTouchTarget, text: 'title', px: theme.spacing.lg },
  lg: { height: 54, text: 'title', px: theme.spacing.xl },
};

/** Accessible button: >=44pt target, loading + disabled states, five variants. */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  ...rest
}: Props) {
  const isInert = disabled || loading;
  const s = bySize[size];
  const solid = variant === 'primary' || variant === 'accent' || variant === 'danger';
  const spinnerColor = solid ? theme.colors.textOnPrimary : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      style={({ pressed }) => [
        styles.base,
        containerByVariant[variant],
        { minHeight: s.height, paddingHorizontal: s.px },
        fullWidth && styles.fullWidth,
        pressed && !isInert && styles.pressed,
        isInert && styles.inert,
        isInert && solid && styles.inertSolid,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text variant={s.text} color={textColorByVariant[variant]}>
            {title}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  inert: { opacity: 0.45 },
  // A disabled solid button keeps its shape but drops the lift — a shadow on an
  // inert control reads as pressable.
  inertSolid: { boxShadow: theme.elevation.none },
});
