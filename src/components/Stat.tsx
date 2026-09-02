import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'success';
  style?: StyleProp<ViewStyle>;
};

/** One metric in a row of metrics — provider trust panel, business summary. */
export function Stat({ label, value, hint, tone = 'default', style }: Props) {
  const valueColor = tone === 'accent' ? 'accent' : tone === 'success' ? 'success' : 'text';
  return (
    <View style={[styles.tile, style]}>
      <Text variant="overline" color="textTertiary">
        {label.toUpperCase()}
      </Text>
      <Text variant="h2" color={valueColor} numeric selectable>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 96,
    gap: 2,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
  },
});
