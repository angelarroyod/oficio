import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Card, Text } from '@/components';
import { jobStatusBadge } from '@/lib/domain';
import { formatDayLabel, formatWindow } from '@/lib/format';
import { theme } from '@/theme';

import type { JobDetail } from './api';

type Props = {
  job: JobDetail;
  /** Which side is reading — decides whose name the card shows. */
  viewerRole: 'client' | 'provider';
  onPress?: () => void;
};

/**
 * A scheduled visit. The arrival window is the headline: it is the promise the
 * product is built around, so it gets the largest type on the card, not the
 * price.
 */
export function JobCard({ job, viewerRole, onPress }: Props) {
  const status = jobStatusBadge(job.status);
  const counterpart = viewerRole === 'client' ? job.provider : job.client;
  const title = job.quotes?.requests?.title ?? '';

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.window}>
          <Text variant="overline" color="primary">
            {formatDayLabel(job.window_start).toUpperCase()}
          </Text>
          <Text variant="h3" numeric>
            {formatWindow(job.window_start, job.window_end)}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} dot />
      </View>

      {title ? (
        <Text variant="title" numberOfLines={1}>
          {title}
        </Text>
      ) : null}

      <View style={styles.footer}>
        {counterpart ? (
          <>
            <Avatar name={counterpart.full_name} size={28} />
            <Text variant="bodySm" color="textSecondary" numberOfLines={1}>
              {counterpart.full_name}
            </Text>
          </>
        ) : null}
        <View style={styles.spacer} />
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  window: { gap: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  spacer: { flex: 1 },
});
