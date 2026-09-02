import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Input, Screen, SectionHeader, Text } from '@/components';
import { useProviderDetails, useUpdateProviderDetails } from '@/features/providers/hooks';
import { copy } from '@/lib/copy';
import { TRADES } from '@/lib/domain';
import { resolveCurrentPlace } from '@/lib/location';
import { theme } from '@/theme';
import type { TradeType } from '@/types/database';

const RADII = [5, 10, 15, 25, 50];

/**
 * Trades, radius and base point. Without all three the feed policy matches
 * nothing, which is why the opportunities tab routes a new provider straight
 * here instead of showing an empty list.
 */
export default function ProviderSetupScreen() {
  const router = useRouter();
  const details = useProviderDetails();
  const update = useUpdateProviderDetails();

  const [trades, setTrades] = useState<TradeType[]>([]);
  const [radius, setRadius] = useState(10);
  const [bio, setBio] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once: later edits must not be overwritten by a background refetch.
  useEffect(() => {
    if (hydrated || !details.data) return;
    setTrades(details.data.trades);
    setRadius(Number(details.data.service_radius_km));
    setBio(details.data.bio ?? '');
    if (details.data.base_lat != null && details.data.base_lng != null) {
      setCoords({ lat: details.data.base_lat, lng: details.data.base_lng });
    }
    setHydrated(true);
  }, [details.data, hydrated]);

  async function useMyLocation() {
    setLocating(true);
    try {
      const place = await resolveCurrentPlace();
      if (!place) {
        Alert.alert(copy.common.appName, copy.newRequest.locationDenied);
        return;
      }
      setCoords({ lat: place.lat, lng: place.lng });
    } catch {
      Alert.alert(copy.common.appName, copy.newRequest.locationDenied);
    } finally {
      setLocating(false);
    }
  }

  function save() {
    if (trades.length === 0) {
      Alert.alert(copy.common.appName, copy.profile.tradesRequired);
      return;
    }
    update.mutate(
      {
        trades,
        serviceRadiusKm: radius,
        bio,
        baseLat: coords?.lat ?? null,
        baseLng: coords?.lng ?? null,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
      },
    );
  }

  return (
    <Screen
      bottomInset
      contentStyle={styles.content}
      footer={<Button title={copy.common.save} loading={update.isPending} onPress={save} />}
    >
      <View style={styles.section}>
        <SectionHeader title={copy.profile.tradesLabel} />
        <View style={styles.tradeGrid}>
          {TRADES.map((trade) => {
            const selected = trades.includes(trade.value);
            return (
              <Pressable
                key={trade.value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() =>
                  setTrades((current) =>
                    selected
                      ? current.filter((value) => value !== trade.value)
                      : [...current, trade.value],
                  )
                }
                style={({ pressed }) => [
                  styles.tradeCard,
                  selected && styles.tradeCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={trade.icon}
                  size={22}
                  color={selected ? theme.colors.primary : trade.fg}
                />
                <Text variant="label" center>
                  {trade.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={copy.profile.radiusLabel} />
        <View style={styles.chipRow}>
          {RADII.map((value) => (
            <Chip
              key={value}
              label={copy.profile.radiusValue(value)}
              selected={radius === value}
              onPress={() => setRadius(value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title={copy.profile.baseLocationLabel}
          subtitle={copy.profile.baseLocationHint}
        />
        <Card style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Ionicons
              name={coords ? 'checkmark-circle' : 'alert-circle-outline'}
              size={20}
              color={coords ? theme.colors.success : theme.colors.danger}
            />
            <Text variant="bodySm" color={coords ? 'success' : 'danger'}>
              {coords ? copy.newRequest.locationSet : copy.profile.baseLocationMissing}
            </Text>
          </View>
          <Button
            title={locating ? copy.newRequest.locating : copy.newRequest.useMyLocation}
            variant="secondary"
            loading={locating}
            onPress={() => void useMyLocation()}
            leftIcon={<Ionicons name="navigate-outline" size={18} color={theme.colors.primary} />}
          />
        </Card>
      </View>

      <Input
        label={copy.profile.bioLabel}
        placeholder={copy.profile.bioPlaceholder}
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={600}
        counter
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  section: { gap: theme.spacing.md },
  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  tradeCard: {
    width: 100,
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tradeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
  },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  locationCard: { gap: theme.spacing.md },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  pressed: { opacity: 0.8 },
});
