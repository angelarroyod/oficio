import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  RatingStars,
  Screen,
  SectionHeader,
  Stat,
  Text,
} from '@/components';
import { signOut } from '@/features/auth/api';
import { useProviderDetails, useProviderReviews } from '@/features/providers/hooks';
import { copy } from '@/lib/copy';
import { tradeMeta } from '@/lib/domain';
import { formatDayShort, formatRelative } from '@/lib/format';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';

type Props = {
  onEditProfile: () => void;
  /** Provider only: opens the trades / radius / base-location editor. */
  onEditProvider?: () => void;
};

/**
 * Shared profile shell. For a provider this is also the trust surface: the
 * metrics shown here are the same computed columns clients see, and none of
 * them are editable — that is the point.
 */
export function ProfileScreenBase({ onEditProfile, onEditProvider }: Props) {
  const profile = useSessionStore((state) => state.profile);
  const reset = useSessionStore((state) => state.reset);
  const [busy, setBusy] = useState(false);

  const isProvider = profile?.role === 'provider';
  const details = useProviderDetails();
  const reviews = useProviderReviews(isProvider ? profile?.id : undefined);

  async function onSignOut() {
    setBusy(true);
    try {
      await signOut();
      reset();
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
      setBusy(false);
    }
  }

  if (!profile) return null;

  const roleLabel = isProvider ? copy.auth.roleProvider : copy.auth.roleClient;
  const providerDetails = details.data;
  const averageRating =
    reviews.data && reviews.data.length > 0
      ? reviews.data.reduce((sum, review) => sum + review.rating, 0) / reviews.data.length
      : null;

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.identity}>
        <Avatar name={profile.full_name} uri={profile.avatar_url} size={64} />
        <View style={styles.identityText}>
          <Text variant="h2">{profile.full_name}</Text>
          <Text variant="caption" color="textSecondary">
            {copy.profile.memberSince(formatDayShort(profile.created_at))}
          </Text>
          <View style={styles.badgeRow}>
            <Badge label={roleLabel} tone="primary" />
            {isProvider && providerDetails ? (
              <Badge
                label={copy.profile.verification[providerDetails.verification_level]}
                tone={providerDetails.verification_level === 'basic' ? 'neutral' : 'success'}
              />
            ) : null}
          </View>
        </View>
      </Card>

      {isProvider ? (
        <>
          <View style={styles.section}>
            <SectionHeader title={copy.profile.metricsTitle} />
            <View style={styles.statRow}>
              <Stat
                label={copy.profile.punctuality}
                value={
                  providerDetails?.punctuality_score != null
                    ? Math.round(providerDetails.punctuality_score) + '%'
                    : '—'
                }
                tone="success"
              />
              <Stat
                label={copy.profile.completion}
                value={
                  providerDetails?.completion_rate != null
                    ? Math.round(providerDetails.completion_rate) + '%'
                    : '—'
                }
              />
              <Stat
                label={copy.profile.responseTime}
                value={
                  providerDetails?.avg_response_minutes != null
                    ? Math.round(providerDetails.avg_response_minutes) + ' min'
                    : '—'
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title={copy.profile.providerSetupTitle}
              actionLabel={copy.common.save}
              onAction={onEditProvider}
            />
            <Card style={styles.setupCard}>
              <View style={styles.chipRow}>
                {(providerDetails?.trades ?? []).length === 0 ? (
                  <Text variant="bodySm" color="danger">
                    {copy.profile.tradesRequired}
                  </Text>
                ) : (
                  providerDetails!.trades.map((trade) => (
                    <Chip key={trade} label={tradeMeta(trade).label} icon={tradeMeta(trade).icon} />
                  ))
                )}
              </View>
              <Divider />
              <View style={styles.metaRow}>
                <Ionicons name="resize-outline" size={16} color={theme.colors.textSecondary} />
                <Text variant="bodySm" color="textSecondary">
                  {copy.profile.radiusValue(providerDetails?.service_radius_km ?? 10)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
                <Text
                  variant="bodySm"
                  color={providerDetails?.base_lat != null ? 'textSecondary' : 'danger'}
                >
                  {providerDetails?.base_lat != null
                    ? copy.newRequest.locationSet
                    : copy.profile.baseLocationMissing}
                </Text>
              </View>
              {providerDetails?.bio ? (
                <>
                  <Divider />
                  <Text variant="bodySm" color="textSecondary">
                    {providerDetails.bio}
                  </Text>
                </>
              ) : null}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title={copy.profile.reviewsTitle}
              subtitle={
                averageRating != null ? averageRating.toFixed(1) + ' / 5' : copy.profile.noMetrics
              }
            />
            {(reviews.data ?? []).length === 0 ? (
              <Card variant="flat">
                <Text variant="bodySm" color="textSecondary" center>
                  {copy.profile.reviewsEmpty}
                </Text>
              </Card>
            ) : (
              (reviews.data ?? []).slice(0, 5).map((review) => (
                <Card key={review.id} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <RatingStars value={review.rating} size={15} />
                    <Text variant="caption" color="textTertiary">
                      {formatRelative(review.created_at)}
                    </Text>
                  </View>
                  {review.comment ? (
                    <Text variant="bodySm" color="textSecondary">
                      {review.comment}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="textTertiary">
                    {review.client?.full_name ?? ''}
                  </Text>
                </Card>
              ))
            )}
          </View>
        </>
      ) : (
        <Card style={styles.setupCard}>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
            <Text variant="bodySm" color="textSecondary" selectable>
              {profile.phone ?? '—'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="home-outline" size={16} color={theme.colors.textSecondary} />
            <Text variant="bodySm" color="textSecondary">
              {[profile.colonia, profile.city].filter(Boolean).join(', ') || '—'}
            </Text>
          </View>
        </Card>
      )}

      <View style={styles.section}>
        <SectionHeader title={copy.profile.account} />
        <Button title={copy.profile.editTitle} variant="secondary" onPress={onEditProfile} />
        <Button
          title={copy.auth.signOut}
          variant="ghost"
          onPress={() => void onSignOut()}
          loading={busy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  identity: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  identityText: { flex: 1, gap: theme.spacing.xs },
  badgeRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  section: { gap: theme.spacing.md },
  statRow: { flexDirection: 'row', gap: theme.spacing.sm },
  setupCard: { gap: theme.spacing.sm },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  review: { gap: theme.spacing.sm },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
