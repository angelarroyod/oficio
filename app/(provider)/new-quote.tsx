import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Chip,
  DetailRow,
  Divider,
  Input,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
} from '@/components';
import { quoteTotals } from '@/features/quotes/api';
import { useCreateQuote } from '@/features/quotes/hooks';
import { useRequest } from '@/features/requests/hooks';
import { copy } from '@/lib/copy';
import { tradeMeta, urgencyMeta } from '@/lib/domain';
import { formatPesos, formatRelative } from '@/lib/format';
import { theme } from '@/theme';
import type { QuoteLineItem } from '@/types/database';

type DraftLine = { concept: string; qty: string; unitPrice: string; type: 'labor' | 'material' };

const EMPTY_LINE: DraftLine = { concept: '', qty: '1', unitPrice: '', type: 'labor' };
const DURATIONS = [30, 60, 120, 240, 480];
const VALIDITIES = [1, 3, 7];

/** Parses a typed amount tolerantly: "1,250.50" and "1250,50" both work. */
function toNumber(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(/,(\d{1,2})$/, '.$1').replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * The quote builder. Labor and materials are separate line items because the
 * whole pitch to clients is a price they can read — a single "mano de obra y
 * material: $3,400" is the thing this product exists to replace.
 */
export default function NewQuoteScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const request = useRequest(requestId);
  const create = useCreateQuote();

  const [lines, setLines] = useState<DraftLine[]>([{ ...EMPTY_LINE }]);
  const [duration, setDuration] = useState(60);
  const [validityDays, setValidityDays] = useState(3);
  const [notes, setNotes] = useState('');

  const lineItems = useMemo<QuoteLineItem[]>(
    () =>
      lines
        .filter((line) => line.concept.trim().length >= 2 && toNumber(line.unitPrice) > 0)
        .map((line) => ({
          concept: line.concept.trim(),
          qty: toNumber(line.qty) || 1,
          unit_price: toNumber(line.unitPrice),
          type: line.type,
        })),
    [lines],
  );
  const totals = quoteTotals(lineItems);

  const data = request.data;
  const alreadyQuoted = (data?.quotes ?? []).some(
    (quote) => quote.status === 'sent' || quote.status === 'accepted',
  );

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, ...patch } : line)),
    );
  }

  function submit() {
    if (lineItems.length === 0) {
      Alert.alert(copy.common.appName, copy.quote.linesRequired);
      return;
    }
    create.mutate(
      {
        requestId: requestId!,
        lineItems,
        estimatedDurationMinutes: duration,
        notes,
        validityDays,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
      },
    );
  }

  if (request.isPending) {
    return (
      <Screen>
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <Screen
      bottomInset
      contentStyle={styles.content}
      footer={
        alreadyQuoted ? undefined : (
          <Button
            title={copy.quote.send + ' · ' + formatPesos(totals.total)}
            variant="accent"
            disabled={lineItems.length === 0}
            loading={create.isPending}
            onPress={submit}
          />
        )
      }
    >
      {data ? (
        <Card variant="flat" style={styles.requestCard}>
          <Text variant="title">{data.title}</Text>
          <Text variant="bodySm" color="textSecondary" numberOfLines={3}>
            {data.description}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={tradeMeta(data.trade).label} tone="primary" />
            <Badge label={urgencyMeta(data.urgency).label} tone={urgencyMeta(data.urgency).tone} />
            <Text variant="caption" color="textTertiary">
              {formatRelative(data.created_at)}
            </Text>
          </View>
        </Card>
      ) : null}

      {alreadyQuoted ? (
        <Card variant="accent">
          <Text variant="body" center>
            {copy.quote.alreadyQuoted}
          </Text>
        </Card>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={copy.quote.conceptLabel} />

        {lines.map((line, index) => (
          <Card key={index} style={styles.lineCard}>
            <View style={styles.lineHeader}>
              <View style={styles.typeChips}>
                <Chip
                  label={copy.quote.typeLabor}
                  selected={line.type === 'labor'}
                  onPress={() => updateLine(index, { type: 'labor' })}
                />
                <Chip
                  label={copy.quote.typeMaterial}
                  selected={line.type === 'material'}
                  onPress={() => updateLine(index, { type: 'material' })}
                />
              </View>
              {lines.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.quote.removeLine}
                  hitSlop={8}
                  onPress={() =>
                    setLines((current) => current.filter((_, position) => position !== index))
                  }
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                </Pressable>
              ) : null}
            </View>

            <Input
              placeholder={copy.quote.conceptPlaceholder}
              value={line.concept}
              onChangeText={(value) => updateLine(index, { concept: value })}
              maxLength={120}
            />

            <View style={styles.numbersRow}>
              <Input
                label={copy.quote.qtyLabel}
                keyboardType="decimal-pad"
                value={line.qty}
                onChangeText={(value) => updateLine(index, { qty: value })}
                containerStyle={styles.qtyField}
              />
              <Input
                label={copy.quote.unitPriceLabel}
                keyboardType="decimal-pad"
                value={line.unitPrice}
                onChangeText={(value) => updateLine(index, { unitPrice: value })}
                prefix={<Text color="textTertiary">$</Text>}
                containerStyle={styles.grow}
              />
            </View>
          </Card>
        ))}

        <Button
          title={copy.quote.addLine}
          variant="secondary"
          onPress={() => setLines((current) => [...current, { ...EMPTY_LINE }])}
          leftIcon={<Ionicons name="add" size={18} color={theme.colors.primary} />}
        />
      </View>

      <Card variant="accent" style={styles.totalsCard}>
        <DetailRow label={copy.quote.subtotal} value={formatPesos(totals.subtotal)} />
        <DetailRow label={copy.quote.iva} value={formatPesos(totals.iva)} />
        <Divider />
        <DetailRow label={copy.quote.total} value={formatPesos(totals.total)} strong />
      </Card>

      <View style={styles.section}>
        <SectionHeader title={copy.quote.durationLabel} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {DURATIONS.map((minutes) => (
            <Chip
              key={minutes}
              label={copy.quote.durationValue(minutes)}
              selected={duration === minutes}
              onPress={() => setDuration(minutes)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader title={copy.quote.validityLabel} />
        <View style={styles.chipRow}>
          {VALIDITIES.map((days) => (
            <Chip
              key={days}
              label={copy.quote.validityDays(days)}
              selected={validityDays === days}
              onPress={() => setValidityDays(days)}
            />
          ))}
        </View>
      </View>

      <Input
        label={copy.quote.notesLabel}
        placeholder={copy.quote.notesPlaceholder}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={1000}
        counter
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  requestCard: { gap: theme.spacing.sm },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  section: { gap: theme.spacing.md },
  lineCard: { gap: theme.spacing.md },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeChips: { flexDirection: 'row', gap: theme.spacing.sm },
  numbersRow: { flexDirection: 'row', gap: theme.spacing.md },
  qtyField: { width: 92 },
  totalsCard: { gap: theme.spacing.sm },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  grow: { flex: 1 },
});
