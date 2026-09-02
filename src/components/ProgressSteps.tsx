import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Props = {
  /** 1-based index of the active step. */
  current: number;
  total: number;
  label: string;
  style?: StyleProp<ViewStyle>;
};

/** Wizard progress: a bar per step plus "paso n de m" for screen readers. */
export function ProgressSteps({ current, total, label, style }: Props) {
  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      <View style={styles.bars}>
        {Array.from({ length: total }, (_, index) => (
          <View key={index} style={[styles.bar, index < current && styles.barDone]} />
        ))}
      </View>
      <Text variant="caption" color="textSecondary">
        {'Paso ' + current + ' de ' + total + ' · ' + label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  bars: { flexDirection: 'row', gap: theme.spacing.xs },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.surfaceSunken,
  },
  barDone: { backgroundColor: theme.colors.primary },
});
