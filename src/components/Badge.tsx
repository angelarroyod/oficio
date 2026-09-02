import { StyleSheet, View, type ViewStyle } from 'react-native';

import { theme, type ColorToken } from '@/theme';

import { Text } from './Text';

export type BadgeTone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  tone?: BadgeTone;
  /** Leading dot — makes state readable without relying on hue alone. */
  dot?: boolean;
  style?: ViewStyle;
};

const toneStyles: Record<BadgeTone, { bg: string; fg: ColorToken }> = {
  neutral: { bg: theme.colors.surfaceMuted, fg: 'textSecondary' },
  primary: { bg: theme.colors.primaryTint, fg: 'primary' },
  accent: { bg: theme.colors.accentTint, fg: 'accent' },
  success: { bg: theme.colors.successTint, fg: 'success' },
  warning: { bg: theme.colors.warningTint, fg: 'warning' },
  danger: { bg: theme.colors.dangerTint, fg: 'danger' },
};

/** Status pill — request/quote/job states, verification levels, urgency. */
export function Badge({ label, tone = 'neutral', dot = false, style }: Props) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: theme.colors[t.fg] }]} /> : null}
      <Text variant="caption" color={t.fg} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs + 2,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontWeight: '700' },
});
