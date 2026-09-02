import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Chip,
  DetailRow,
  Divider,
  EmptyState,
  IconTile,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
} from '@/components';
import { QuoteCard } from '@/features/quotes/QuoteCard';
import { useAcceptQuote } from '@/features/quotes/hooks';
import { useCancelRequest, useRequest } from '@/features/requests/hooks';
import { copy } from '@/lib/copy';
import { requestStatusBadge, tradeMeta, urgencyMeta } from '@/lib/domain';
import { formatDayLabel, formatPesos, formatRelative, nextDays, windowSlotsForDay } from '@/lib/format';
import { BUCKETS, usePhotoUrls } from '@/lib/storage';
import { theme } from '@/theme';
import type { Quote } from '@/types/database';

/**
 * Request detail — where the product's promise is kept or broken. Quotes are
 * sorted by price and tagged (cheapest, fastest) so a comparison that would
 * otherwise mean three phone calls is one screen of scanning.
 */
export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const request = useRequest(id);
  const cancel = useCancelRequest();
  const accept = useAcceptQuote(id);

  const [selected, setSelected] = useState<Quote | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);

  const data = request.data;
  const photos = usePhotoUrls(BUCKETS.requestPhotos, data?.photos);

  const days = useMemo(() => nextDays(7), []);
  const slots = useMemo(
    () => windowSlotsForDay(days[dayIndex] ?? days[0]!),
    [days, dayIndex],
  );

  const liveQuotes = useMemo(
    () =>
      (data?.quotes ?? [])
        .filter((quote) => quote.status === 'sent')
        .sort((a, b) => a.total - b.total),
    [data],
  );
  const cheapestId = liveQuotes[0]?.id;
  const fastestId = useMemo(
    () =>
      [...liveQuotes].sort(
        (a, b) => a.estimated_duration_minutes - b.estimated_duration_minutes,
      )[0]?.id,
    [liveQuotes],
  );

  if (request.isPending) {
    return (
      <Screen contentStyle={styles.content}>
        <SkeletonCard />
        <SkeletonCard />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title={copy.common.genericError} />
      </Screen>
    );
  }

  const trade = tradeMeta(data.trade);
  const urgency = urgencyMeta(data.urgency);
  const status = requestStatusBadge(data.status);
  const canCancel = data.status === 'open' || data.status === 'quoted';
  const chosenSlot = slotIndex === null ? null : slots[slotIndex];

  function onCancel() {
    Alert.alert(copy.request.cancelRequest, copy.request.cancelConfirm, [
      { text: copy.common.back, style: 'cancel' },
      {
        text: copy.request.cancelRequest,
        style: 'destructive',
        onPress: () => {
          cancel.mutate(id, { onError: () => Alert.alert(copy.common.appName, copy.common.genericError) });
        },
      },
    ]);
  }

  function onAccept() {
    if (!selected || !chosenSlot) return;
    accept.mutate(
      { quoteId: selected.id, windowStart: chosenSlot.start, windowEnd: chosenSlot.end },
      {
        onSuccess: (job) => {
          setSelected(null);
          router.replace({ pathname: '/(client)/job/[id]', params: { id: job.id } });
        },
        onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
      },
    );
  }

  return (
    <Screen
      contentStyle={styles.content}
      footer={
        selected ? (
          <Button
            title={copy.quote.accept + ' · ' + formatPesos(selected.total)}
            variant="accent"
            disabled={!chosenSlot}
            loading={accept.isPending}
            onPress={onAccept}
          />
        ) : undefined
      }
    >
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <IconTile name={trade.icon} color={trade.fg} background={trade.bg} size="lg" />
          <View style={styles.headerText}>
            <Text variant="h2">{data.title}</Text>
            <Text variant="caption" color="textSecondary">
              {trade.label + ' · ' + formatRelative(data.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.badges}>
          <Badge label={status.label} tone={status.tone} dot />
          <Badge label={urgency.label} tone={urgency.tone} />
          <Badge label={copy.visitType[data.visit_type]} tone="neutral" />
        </View>

        <Divider />

        <Text variant="body" selectable>
          {data.description}
        </Text>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
          <Text variant="bodySm" color="textSecondary" selectable style={styles.grow}>
            {data.address_text}
          </Text>
        </View>
      </Card>

      {photos.data && photos.data.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={copy.request.photos} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.data.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={styles.photo}
                accessibilityIgnoresInvertColors
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title={copy.request.quotesTitle}
          subtitle={copy.request.quotesCount(liveQuotes.length)}
        />

        {liveQuotes.length === 0 ? (
          <Card variant="flat">
            <EmptyState
              icon="hourglass-outline"
              title={copy.request.quotesEmpty}
              body={copy.request.quotesEmptyBody}
            />
          </Card>
        ) : (
          liveQuotes.map((quote) => {
            const isSelected = selected?.id === quote.id;
            return (
              <View key={quote.id} style={styles.quoteBlock}>
                <QuoteCard
                  quote={quote}
                  tag={
                    quote.id === cheapestId
                      ? copy.request.bestPrice
                      : quote.id === fastestId
                        ? copy.request.fastest
                        : undefined
                  }
                  title={copy.quote.listTitle}
                  onPress={() => {
                    setSelected(isSelected ? null : quote);
                    setSlotIndex(null);
                  }}
                />

                {isSelected ? (
                  <Card variant="accent" style={styles.breakdown}>
                    {quote.line_items.map((item, index) => (
                      <DetailRow
                        key={item.concept + index}
                        label={item.concept + ' × ' + item.qty}
                        value={formatPesos(item.qty * item.unit_price)}
                      />
                    ))}
                    <Divider />
                    <DetailRow label={copy.quote.subtotal} value={formatPesos(quote.subtotal)} />
                    <DetailRow label={copy.quote.iva} value={formatPesos(quote.iva)} />
                    <DetailRow label={copy.quote.total} value={formatPesos(quote.total)} strong />
                    {quote.notes ? (
                      <Text variant="bodySm" color="textSecondary" selectable>
                        {quote.notes}
                      </Text>
                    ) : null}

                    <Divider />

                    <Text variant="h3">{copy.quote.acceptTitle}</Text>
                    <Text variant="bodySm" color="textSecondary">
                      {copy.quote.acceptHint}
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {days.map((day, index) => (
                        <Chip
                          key={day.toISOString()}
                          label={formatDayLabel(day)}
                          selected={index === dayIndex}
                          onPress={() => {
                            setDayIndex(index);
                            setSlotIndex(null);
                          }}
                        />
                      ))}
                    </ScrollView>

                    <View style={styles.slotGrid}>
                      {slots.length === 0 ? (
                        <Text variant="bodySm" color="textSecondary">
                          {copy.schedule.emptyToday}
                        </Text>
                      ) : (
                        slots.map((slot, index) => (
                          <Chip
                            key={slot.label}
                            label={slot.label}
                            selected={index === slotIndex}
                            onPress={() => setSlotIndex(index)}
                          />
                        ))
                      )}
                    </View>
                  </Card>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      {canCancel ? (
        <Button
          title={copy.request.cancelRequest}
          variant="ghost"
          loading={cancel.isPending}
          onPress={onCancel}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  headerCard: { gap: theme.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  headerText: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.xs + 2 },
  grow: { flex: 1 },
  section: { gap: theme.spacing.md },
  photoRow: { gap: theme.spacing.sm },
  photo: {
    width: 132,
    height: 132,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surfaceMuted,
  },
  quoteBlock: { gap: theme.spacing.sm },
  breakdown: { gap: theme.spacing.sm },
  chipRow: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
});
