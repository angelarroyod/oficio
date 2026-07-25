import {
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';

type Props = ViewProps & {
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Surface container. Becomes pressable (with a11y role) when onPress given. */
export function Card({ onPress, padded = true, style, children, ...rest }: Props) {
  const base = [styles.card, padded && styles.padded, style];

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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  padded: { padding: theme.spacing.lg },
  pressed: { opacity: 0.92 },
});
