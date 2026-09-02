import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Card, Text } from '@/components';
import { copy } from '@/lib/copy';
import { quoteStatusBadge } from '@/lib/domain';
import { formatDayShort, formatPesos } from '@/lib/format';
import { theme } from '@/theme';
import type { Quote } from '@/types/database';

type Props = {
  quote: Quote;
  /** Who sent it — omitted on the provider's own list, where it is always them. */
  providerName?: string;
  /** "Precio más bajo" / "Más rápido" — at most one per card. */
  tag?: string;
  onPress?: () => void;
  /** Title line used on the provider's list, where the request is the subject. */
  title?: string;
};

/**
 * A quote, priced for comparison. Total is the largest element on the card
 * because it is the number the decision turns on; duration and validity sit
 * under it as the two things that change the meaning of that number.
 */
export function QuoteCard({ quote, providerName, tag, onPress, title }: Props) {
  const status = quoteStatusBadge(quote.status);
  const expired = quote.status === 'expired' || new Date(quote.valid_until) < new Date();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        {providerName ? <Avatar name={providerName} size={40} /> : null}
        <View style={styles.headerText}>
          <Text variant="title" numberOfLines={1}>
            {providerName ?? title ?? copy.quote.listTitle}
          </Text>
          <Text variant="caption" color="textSecondary">
            {copy.quote.durationValue(quote.estimated_duration_minutes) +
              ' · ' +
              copy.quote.validUntil(formatDayShort(quote.valid_until))}
          </Text>
        </View>
        {tag ? <Badge label={tag} tone="accent" /> : null}
      </View>

      <View style={styles.priceRow}>
        <Text variant="h1" numeric selectable>
          {formatPesos(quote.total)}
        </Text>
        <Text variant="caption" color="textTertiary">
          {copy.quote.iva}
        </Text>
      </View>

      <View style={styles.footer}>
        <Badge label={status.label} tone={status.tone} dot />
        {expired && quote.status === 'sent' ? (
          <Badge label={copy.quoteStatus.expired} tone="neutral" />
        ) : null}
        <View style={styles.spacer} />
        <View style={styles.itemCount}>
          <Ionicons name="list-outline" size={13} color={theme.colors.textTertiary} />
          <Text variant="caption" color="textTertiary" numeric>
            {String(quote.line_items.length)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  headerText: { flex: 1, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  itemCount: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  spacer: { flex: 1 },
});
