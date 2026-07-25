import { StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
};

const toneStyles: Record<Tone, { bg: string; fg: Parameters<typeof Text>[0]['color'] }> = {
  neutral: { bg: theme.colors.surfaceMuted, fg: 'textSecondary' },
  primary: { bg: theme.colors.primaryTint, fg: 'primary' },
  success: { bg: theme.colors.successTint, fg: 'success' },
  warning: { bg: theme.colors.warningTint, fg: 'warning' },
  danger: { bg: theme.colors.dangerTint, fg: 'danger' },
};

/** Status pill — request/quote/job states, verification levels, urgency. */
export function Badge({ label, tone = 'neutral', style }: Props) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text variant="caption" color={t.fg} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 3,
  },
  label: { fontWeight: '600' },
});
