import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, EmptyState, IconTile, Screen, SectionHeader, SkeletonCard, Text } from '@/components';
import { JobCard } from '@/features/jobs/JobCard';
import { useMyJobs } from '@/features/jobs/hooks';
import { RequestCard, quotesFootnote } from '@/features/requests/RequestCard';
import { useMyRequests } from '@/features/requests/hooks';
import { copy } from '@/lib/copy';
import { ACTIVE_JOB_STATUSES, ACTIVE_REQUEST_STATUSES, TRADES } from '@/lib/domain';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';
import type { TradeType } from '@/types/database';

/**
 * Client home. One hero action, then the two things a person opens the app to
 * check: is someone coming, and did anyone quote me. Everything else is a tab
 * away — a home screen that lists everything answers nothing.
 */
export default function ClientHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useSessionStore((state) => state.profile);
  const requests = useMyRequests();
  const jobs = useMyJobs();

  const active = (requests.data ?? []).filter((request) =>
    ACTIVE_REQUEST_STATUSES.includes(request.status),
  );
  const pendingQuotes = active.reduce(
    (sum, request) => sum + request.quotes.filter((quote) => quote.status === 'sent').length,
    0,
  );
  const nextJob = (jobs.data ?? []).find((job) => ACTIVE_JOB_STATUSES.includes(job.status));

  function startRequest(trade?: TradeType) {
    router.push({
      pathname: '/(client)/new-request',
      params: trade ? { trade } : {},
    });
  }

  return (
    <Screen padded={false} contentStyle={styles.content}>
      <View style={[styles.hero, { paddingTop: insets.top + theme.spacing.xl }]}>
        <Text variant="h1" color="textInverse">
          {copy.clientHome.greeting(profile?.full_name ?? '')}
        </Text>
        <Text variant="body" color="textInverse" style={styles.heroSubtitle}>
          {copy.clientHome.subtitle}
        </Text>
      </View>

      <View style={styles.body}>
        <Card variant="elevated" style={styles.ctaCard}>
          <View style={styles.ctaText}>
            <Text variant="h3">{copy.clientHome.newRequest}</Text>
            <Text variant="bodySm" color="textSecondary">
              {copy.clientHome.newRequestHint}
            </Text>
          </View>
          <Button
            title={copy.clientHome.newRequest}
            variant="accent"
            onPress={() => startRequest()}
            leftIcon={<Ionicons name="add" size={20} color={theme.colors.textOnPrimary} />}
          />
        </Card>

        <View style={styles.section}>
          <SectionHeader title={copy.clientHome.quickTrades} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tradeRow}
          >
            {TRADES.map((trade) => (
              <Pressable
                key={trade.value}
                accessibilityRole="button"
                accessibilityLabel={trade.label}
                onPress={() => startRequest(trade.value)}
                style={({ pressed }) => [styles.trade, pressed && styles.pressed]}
              >
                <IconTile name={trade.icon} color={trade.fg} background={trade.bg} size="lg" />
                <Text variant="caption" color="textSecondary" center>
                  {trade.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {nextJob ? (
          <View style={styles.section}>
            <SectionHeader title={copy.clientHome.nextJob} />
            <JobCard
              job={nextJob}
              viewerRole="client"
              onPress={() =>
                router.push({ pathname: '/(client)/job/[id]', params: { id: nextJob.id } })
              }
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader
            title={copy.clientHome.activeRequests}
            subtitle={pendingQuotes > 0 ? copy.clientHome.quotesWaiting(pendingQuotes) : undefined}
            actionLabel={active.length > 0 ? copy.common.seeAll : undefined}
            onAction={() => router.push('/(client)/(tabs)/requests')}
          />

          {requests.isPending ? (
            <SkeletonCard />
          ) : active.length === 0 ? (
            <Card variant="flat">
              <EmptyState
                icon="clipboard-outline"
                title={copy.clientHome.noActiveRequests}
                body={copy.clientHome.noActiveRequestsBody}
                actionLabel={copy.clientHome.newRequest}
                onAction={() => startRequest()}
              />
            </Card>
          ) : (
            active.slice(0, 3).map((request) => {
              const openQuotes = request.quotes.filter((quote) => quote.status === 'sent');
              return (
                <RequestCard
                  key={request.id}
                  request={request}
                  footnote={quotesFootnote(openQuotes.length)}
                  highlight={openQuotes.length > 0 ? String(openQuotes.length) : undefined}
                  onPress={() =>
                    router.push({
                      pathname: '/(client)/request/[id]',
                      params: { id: request.id },
                    })
                  }
                />
              );
            })
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 0 },
  hero: {
    backgroundColor: theme.colors.primaryDeep,
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.xxl,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    borderCurve: 'continuous',
    gap: theme.spacing.xs,
  },
  heroSubtitle: { opacity: 0.82 },
  body: {
    paddingHorizontal: theme.layout.screenPadding,
    marginTop: -theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  ctaCard: { gap: theme.spacing.md, boxShadow: theme.elevation.md },
  ctaText: { gap: 2 },
  section: { gap: theme.spacing.md },
  tradeRow: { gap: theme.spacing.md, paddingRight: theme.spacing.lg },
  trade: { width: 72, alignItems: 'center', gap: theme.spacing.xs },
  pressed: { opacity: 0.7 },
});
