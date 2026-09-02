import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Badge, Card, IconTile, Text } from '@/components';
import { copy } from '@/lib/copy';
import { requestStatusBadge, tradeMeta, urgencyMeta } from '@/lib/domain';
import { formatRelative } from '@/lib/format';
import { theme } from '@/theme';
import type { ServiceRequest } from '@/types/database';

type Props = {
  request: ServiceRequest;
  onPress?: () => void;
  /** Trailing line: quote count for a client, distance for a provider. */
  footnote?: string;
  /** Right-hand emphasis (e.g. "3 cotizaciones") shown as an accent badge. */
  highlight?: string;
};

/**
 * The unit of both feeds. Trade tile first because it is the fastest thing to
 * scan, urgency and status as pills, and one line of relative age — a request
 * from three days ago is a different proposition than one from ten minutes ago.
 */
export function RequestCard({ request, onPress, footnote, highlight }: Props) {
  const trade = tradeMeta(request.trade);
  const urgency = urgencyMeta(request.urgency);
  const status = requestStatusBadge(request.status);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <IconTile name={trade.icon} color={trade.fg} background={trade.bg} />
        <View style={styles.headerText}>
          <Text variant="title" numberOfLines={1}>
            {request.title}
          </Text>
          <Text variant="caption" color="textSecondary">
            {trade.label + ' · ' + formatRelative(request.created_at)}
          </Text>
        </View>
        {highlight ? <Badge label={highlight} tone="accent" /> : null}
      </View>

      <Text variant="bodySm" color="textSecondary" numberOfLines={2}>
        {request.description}
      </Text>

      <View style={styles.footer}>
        <Badge label={urgency.label} tone={urgency.tone} dot />
        <Badge label={status.label} tone={status.tone} />
        {request.photos.length > 0 ? (
          <View style={styles.photoCount}>
            <Ionicons name="image-outline" size={13} color={theme.colors.textTertiary} />
            <Text variant="caption" color="textTertiary" numeric>
              {String(request.photos.length)}
            </Text>
          </View>
        ) : null}
        <View style={styles.spacer} />
        {footnote ? (
          <Text variant="caption" color="textSecondary">
            {footnote}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

/** Client-side footnote: how many quotes have landed on this request. */
export function quotesFootnote(count: number): string {
  return copy.request.quotesCount(count);
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  headerText: { flex: 1, gap: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  photoCount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  spacer: { flex: 1 },
});
