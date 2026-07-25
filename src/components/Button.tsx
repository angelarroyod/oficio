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

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const containerByVariant: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: theme.colors.primary },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: theme.colors.danger },
};

const textColorByVariant: Record<Variant, Parameters<typeof Text>[0]['color']> = {
  primary: 'textOnPrimary',
  secondary: 'primary',
  ghost: 'primary',
  danger: 'textOnPrimary',
};

const heightBySize: Record<Size, number> = {
  md: theme.layout.minTouchTarget,
  lg: 52,
};

/** Accessible button: >=44pt target, loading + disabled states, four variants. */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  style,
  ...rest
}: Props) {
  const isInert = disabled || loading;
  const spinnerColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.textOnPrimary
      : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      disabled={isInert}
      style={({ pressed }) => [
        styles.base,
        containerByVariant[variant],
        { minHeight: heightBySize[size] },
        fullWidth && styles.fullWidth,
        pressed && !isInert && styles.pressed,
        isInert && styles.inert,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text variant="title" color={textColorByVariant[variant]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  pressed: { opacity: 0.85 },
  inert: { opacity: 0.5 },
});
