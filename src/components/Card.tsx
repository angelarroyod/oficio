import {
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';

type Variant = 'elevated' | 'flat' | 'outline' | 'accent';

type Props = ViewProps & {
  onPress?: () => void;
  padded?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
};

const byVariant: Record<Variant, ViewStyle> = {
  elevated: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    boxShadow: theme.elevation.sm,
  },
  flat: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: 'transparent',
  },
  outline: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
  },
  accent: {
    backgroundColor: theme.colors.primarySurface,
    borderColor: theme.colors.primaryBorder,
  },
};

/** Surface container. Becomes pressable (with a11y role) when onPress given. */
export function Card({
  onPress,
  padded = true,
  variant = 'elevated',
  style,
  children,
  ...rest
}: Props) {
  const base = [styles.card, byVariant[variant], padded && styles.padded, style];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [...base, pressed && styles.pressed]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    overflow: 'hidden',
  },
  padded: { padding: theme.spacing.lg },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
});
