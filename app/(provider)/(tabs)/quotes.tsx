import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  DetailRow,
  Divider,
  EmptyState,
  Screen,
  SegmentedControl,
  SkeletonCard,
  Text,
} from '@/components';
import { QuoteCard } from '@/features/quotes/QuoteCard';
import { useMyQuotes, useWithdrawQuote } from '@/features/quotes/hooks';
import { shareQuotePdf } from '@/features/quotes/pdf';
import { copy } from '@/lib/copy';
import { OPEN_QUOTE_STATUSES } from '@/lib/domain';
import { formatPesos } from '@/lib/format';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';

type Tab = 'sent' | 'closed';

export default function ProviderQuotesScreen() {
  const [tab, setTab] = useState<Tab>('sent');
  const [expanded, setExpanded] = useState<string | null>(null);
  const profile = useSessionStore((state) => state.profile);
  const quotes = useMyQuotes();
  const withdraw = useWithdrawQuote();

  const all = quotes.data ?? [];
  const sent = all.filter((quote) => OPEN_QUOTE_STATUSES.includes(quote.status));
  const closed = all.filter((quote) => !OPEN_QUOTE_STATUSES.includes(quote.status));
  const visible = tab === 'sent' ? sent : closed;

  function onWithdraw(id: string) {
    Alert.alert(copy.quote.withdraw, copy.quote.withdrawConfirm, [
      { text: copy.common.back, style: 'cancel' },
      {
        text: copy.quote.withdraw,
        style: 'destructive',
        onPress: () =>
          withdraw.mutate(id, {
            onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
          }),
      },
    ]);
  }

  return (
    <Screen contentStyle={styles.content}>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'sent', label: copy.quote.sentTab, count: sent.length },
          { value: 'closed', label: copy.quote.closedTab, count: closed.length },
        ]}
      />

      {quotes.isPending ? (
        <SkeletonCard />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={tab === 'sent' ? 'receipt-outline' : 'archive-outline'}
          title={tab === 'sent' ? copy.quote.emptySent : copy.quote.emptyClosed}
          body={tab === 'sent' ? copy.quote.emptySentBody : copy.quote.emptyClosedBody}
        />
      ) : (
        <View style={styles.list}>
          {visible.map((quote) => (
            <View key={quote.id} style={styles.block}>
              <QuoteCard
                quote={quote}
                title={quote.requests?.title ?? copy.quote.listTitle}
                onPress={() => setExpanded(expanded === quote.id ? null : quote.id)}
              />

              {expanded === quote.id ? (
                <Card variant="accent" style={styles.details}>
                  {quote.line_items.map((item, index) => (
                    <DetailRow
                      key={item.concept + index}
                      label={item.concept + ' × ' + item.qty}
                      value={formatPesos(item.qty * item.unit_price)}
                    />
                  ))}
                  <Divider />
                  <DetailRow label={copy.quote.total} value={formatPesos(quote.total)} strong />
                  {quote.notes ? (
                    <Text variant="bodySm" color="textSecondary">
                      {quote.notes}
                    </Text>
                  ) : null}

                  <Button
                    title={copy.quote.exportPdf}
                    variant="secondary"
                    onPress={() => {
                      void shareQuotePdf(
                        quote,
                        quote.requests,
                        profile?.full_name ?? copy.common.appName,
                      ).catch(() => Alert.alert(copy.common.appName, copy.quote.exportFailed));
                    }}
                  />
                  {quote.status === 'sent' ? (
                    <Button
                      title={copy.quote.withdraw}
                      variant="ghost"
                      loading={withdraw.isPending}
                      onPress={() => onWithdraw(quote.id)}
                    />
                  ) : null}
                </Card>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.lg },
  list: { gap: theme.spacing.md },
  block: { gap: theme.spacing.sm },
  details: { gap: theme.spacing.sm },
});
