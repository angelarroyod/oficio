import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Props = {
  label: string;
  value: string;
  /** Emphasized row — quote totals, the number that decides the tap. */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Label/value row used in quote totals, job details and receipts. */
export function DetailRow({ label, value, strong = false, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text variant={strong ? 'title' : 'bodySm'} color={strong ? 'text' : 'textSecondary'}>
        {label}
      </Text>
      <Text
        variant={strong ? 'h3' : 'bodySm'}
        color={strong ? 'text' : 'text'}
        numeric
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
});
