import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

type Props = {
  value: number;
  /** Omit to render read-only. */
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** 1–5 stars, read-only by default and tappable when onChange is given. */
export function RatingStars({ value, onChange, size = 20, label, style }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View
      accessibilityRole={onChange ? 'adjustable' : 'image'}
      accessibilityLabel={label ?? value + ' de 5'}
      accessibilityValue={{ min: 1, max: 5, now: value }}
      style={[styles.row, style]}
    >
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? theme.colors.accentLight : theme.colors.borderStrong}
          />
        );
        if (!onChange) return <View key={star}>{icon}</View>;
        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={star + ' estrellas'}
            hitSlop={6}
            onPress={() => onChange(star)}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  pressed: { opacity: 0.6 },
});
