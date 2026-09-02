import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, EmptyState, Screen, SkeletonCard, Text } from '@/components';
import { useProviderDetails } from '@/features/providers/hooks';
import { RequestCard } from '@/features/requests/RequestCard';
import { useOpportunities } from '@/features/requests/hooks';
import { copy } from '@/lib/copy';
import { TRADES, distanceKm } from '@/lib/domain';
import { theme } from '@/theme';
import type { TradeType } from '@/types/database';

/**
 * Provider feed. Rows arrive already filtered by trade and radius (RLS), so
 * this screen only decides ordering and the trade toggle — and, when the
 * provider has not set a zone yet, says so instead of showing a mystery void.
 */
export default function OpportunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tradeFilter, setTradeFilter] = useState<TradeType | null>(null);

  const details = useProviderDetails();
  const opportunities = useOpportunities();

  const base =
    details.data?.base_lat != null && details.data.base_lng != null
      ? { lat: details.data.base_lat, lng: details.data.base_lng }
      : null;

  const rows = useMemo(() => {
    const all = opportunities.data ?? [];
    const filtered = tradeFilter ? all.filter((row) => row.trade === tradeFilter) : all;
    if (!base) return filtered;
    return [...filtered].sort(
      (a, b) => distanceKm(base, { lat: a.lat, lng: a.lng }) - distanceKm(base, { lat: b.lat, lng: b.lng }),
    );
  }, [opportunities.data, tradeFilter, base]);

  const needsSetup = !details.isPending && (!details.data?.trades.length || base === null);
  const myTrades = details.data?.trades ?? [];

  return (
    <Screen padded={false} contentStyle={styles.content}>
      <View style={[styles.hero, { paddingTop: insets.top + theme.spacing.lg }]}>
        <Text variant="h1" color="textInverse">
          {copy.opportunities.title}
        </Text>
        <Text variant="bodySm" color="textInverse" style={styles.heroSubtitle}>
          {copy.opportunities.subtitle(rows.length)}
        </Text>
      </View>

      {needsSetup ? (
        <View style={styles.padded}>
          <EmptyState
            icon="options-outline"
            title={copy.opportunities.setupNeeded}
            body={copy.opportunities.setupBody}
            actionLabel={copy.opportunities.setupCta}
            onAction={() => router.push('/(provider)/setup')}
          />
        </View>
      ) : (
        <>
          {myTrades.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <Chip
                label={copy.opportunities.allTrades}
                selected={tradeFilter === null}
                onPress={() => setTradeFilter(null)}
              />
              {TRADES.filter((trade) => myTrades.includes(trade.value)).map((trade) => (
                <Chip
                  key={trade.value}
                  label={trade.label}
                  icon={trade.icon}
                  selected={tradeFilter === trade.value}
                  onPress={() => setTradeFilter(trade.value)}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.list}>
            {opportunities.isPending ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : rows.length === 0 ? (
              <EmptyState
                icon="flash-outline"
                title={copy.opportunities.empty}
                body={copy.opportunities.emptyBody}
              />
            ) : (
              rows.map((request) => {
                const alreadyQuoted = request.quotes.length > 0;
                return (
                  <RequestCard
                    key={request.id}
                    request={request}
                    highlight={alreadyQuoted ? copy.quoteStatus.sent : undefined}
                    footnote={
                      base
                        ? copy.opportunities.distance(
                            distanceKm(base, { lat: request.lat, lng: request.lng }),
                          )
                        : undefined
                    }
                    onPress={() =>
                      router.push({
                        pathname: '/(provider)/new-quote',
                        params: { requestId: request.id },
                      })
                    }
                  />
                );
              })
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 0, gap: theme.spacing.lg },
  hero: {
    backgroundColor: theme.colors.primaryDeep,
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    borderCurve: 'continuous',
    gap: 2,
  },
  heroSubtitle: { opacity: 0.82 },
  filterRow: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
  },
  list: { paddingHorizontal: theme.layout.screenPadding, gap: theme.spacing.md },
  padded: { paddingHorizontal: theme.layout.screenPadding },
});
