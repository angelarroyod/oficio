import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Input,
  Screen,
  SectionHeader,
  SkeletonCard,
  Stat,
  Text,
} from '@/components';
import {
  useCreateFinanceEntry,
  useFinanceEntries,
  useProviderDetails,
} from '@/features/providers/hooks';
import { copy } from '@/lib/copy';
import { formatDayShort, formatPesos } from '@/lib/format';
import { financeAmountSchema, financeCategorySchema } from '@/lib/zod';
import { theme } from '@/theme';
import type { FinanceEntryType } from '@/types/database';

/**
 * Premium ledger. RLS refuses every row for a non-premium provider, so the
 * gate here is honest UI over an already-closed door — and it says where the
 * subscription is sold without selling it (App Store 3.1.3(b)).
 */
export default function ProviderBusinessScreen() {
  const details = useProviderDetails();
  const isPremium = Boolean(details.data?.is_premium);
  const entries = useFinanceEntries(isPremium);
  const create = useCreateFinanceEntry();

  const [type, setType] = useState<FinanceEntryType>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  if (details.isPending) {
    return (
      <Screen>
        <SkeletonCard />
      </Screen>
    );
  }

  if (!isPremium) {
    return (
      <Screen contentStyle={styles.content}>
        <Card variant="accent" style={styles.premiumCard}>
          <Ionicons name="sparkles-outline" size={28} color={theme.colors.accent} />
          <Text variant="h2">{copy.business.premiumTitle}</Text>
          <Text variant="body" color="textSecondary">
            {copy.business.premiumBody}
          </Text>
          <Text variant="caption" color="textTertiary">
            {copy.business.premiumNote}
          </Text>
        </Card>
      </Screen>
    );
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEntries = (entries.data ?? []).filter(
    (entry) => new Date(entry.occurred_at) >= monthStart,
  );
  const income = monthEntries
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = monthEntries
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  function submit() {
    const amountResult = financeAmountSchema.safeParse(Number.parseFloat(amount.replace(',', '.')));
    const categoryResult = financeCategorySchema.safeParse(category);
    setErrors({
      amount: amountResult.success ? undefined : amountResult.error.issues[0]?.message,
      category: categoryResult.success ? undefined : categoryResult.error.issues[0]?.message,
    });
    if (!amountResult.success || !categoryResult.success) return;

    create.mutate(
      { type, amount: amountResult.data, category: categoryResult.data },
      {
        onSuccess: () => {
          setAmount('');
          setCategory('');
        },
        onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
      },
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.statRow}>
        <Stat label={copy.business.income} value={formatPesos(income)} tone="success" />
        <Stat label={copy.business.expense} value={formatPesos(expense)} />
        <Stat
          label={copy.business.balance}
          value={formatPesos(income - expense)}
          tone="accent"
          hint={copy.business.thisMonth}
        />
      </View>

      <Card style={styles.form}>
        <SectionHeader title={copy.business.addEntry} />
        <View style={styles.chipRow}>
          <Chip
            label={copy.business.income}
            selected={type === 'income'}
            onPress={() => setType('income')}
          />
          <Chip
            label={copy.business.expense}
            selected={type === 'expense'}
            onPress={() => setType('expense')}
          />
        </View>
        <Input
          label={copy.business.amountLabel}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          error={errors.amount}
          prefix={<Text color="textTertiary">$</Text>}
        />
        <Input
          label={copy.business.categoryLabel}
          placeholder={copy.business.categoryPlaceholder}
          value={category}
          onChangeText={setCategory}
          error={errors.category}
          maxLength={60}
        />
        <Button title={copy.common.save} loading={create.isPending} onPress={submit} />
      </Card>

      <View style={styles.section}>
        <SectionHeader title={copy.business.thisMonth} />
        {monthEntries.length === 0 ? (
          <EmptyState icon="wallet-outline" title={copy.business.empty} body={copy.business.emptyBody} />
        ) : (
          <Card style={styles.ledger}>
            {monthEntries.map((entry, index) => (
              <View key={entry.id}>
                {index > 0 ? <Divider style={styles.ledgerDivider} /> : null}
                <View style={styles.ledgerRow}>
                  <Ionicons
                    name={entry.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={20}
                    color={entry.type === 'income' ? theme.colors.success : theme.colors.danger}
                  />
                  <View style={styles.grow}>
                    <Text variant="title">{entry.category}</Text>
                    <Text variant="caption" color="textSecondary">
                      {formatDayShort(entry.occurred_at)}
                    </Text>
                  </View>
                  <Text
                    variant="title"
                    color={entry.type === 'income' ? 'success' : 'text'}
                    numeric
                    selectable
                  >
                    {(entry.type === 'income' ? '+' : '−') + formatPesos(entry.amount)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  premiumCard: { gap: theme.spacing.md, alignItems: 'flex-start' },
  statRow: { flexDirection: 'row', gap: theme.spacing.sm },
  form: { gap: theme.spacing.md },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm },
  section: { gap: theme.spacing.md },
  ledger: { gap: theme.spacing.sm },
  ledgerDivider: { marginVertical: theme.spacing.sm },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  grow: { flex: 1 },
});
