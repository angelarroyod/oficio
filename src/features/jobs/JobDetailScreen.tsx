import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  DetailRow,
  Divider,
  EmptyState,
  Input,
  PhotoPicker,
  Screen,
  SectionHeader,
  SkeletonCard,
  Text,
} from '@/components';
import { copy } from '@/lib/copy';
import { jobStatusBadge } from '@/lib/domain';
import { formatDayLong, formatPesos, formatWindow } from '@/lib/format';
import { BUCKETS, usePhotoUrls } from '@/lib/storage';
import { cancellationReasonSchema } from '@/lib/zod';
import { theme } from '@/theme';

import { JobTimeline } from './JobTimeline';
import { useJob, useJobAction } from './hooks';

type Props = {
  jobId: string | undefined;
  viewerRole: 'client' | 'provider';
};

/**
 * One screen for both sides of a visit. The provider drives the state machine
 * and the client watches it — the difference is which buttons render, not which
 * data is fetched, so there is one place to keep the two views honest.
 */
export function JobDetailScreen({ jobId, viewerRole }: Props) {
  const router = useRouter();
  const job = useJob(jobId);
  const actions = useJobAction(jobId);

  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();

  const data = job.data;
  const photos = usePhotoUrls(BUCKETS.jobPhotos, data?.completion_photos);

  if (job.isPending) {
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

  const status = jobStatusBadge(data.status);
  const quote = data.quotes;
  const request = quote?.requests ?? null;
  const counterpart = viewerRole === 'client' ? data.provider : data.client;
  const review = data.reviews[0];

  function fail() {
    Alert.alert(copy.common.appName, copy.common.genericError);
  }

  function confirmCancel() {
    const parsed = cancellationReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message);
      return;
    }
    actions.cancel.mutate(parsed.data, {
      onSuccess: () => {
        setCancelling(false);
        setReason('');
      },
      onError: fail,
    });
  }

  function complete() {
    if (completionPhotos.length === 0) {
      Alert.alert(copy.common.appName, copy.schedule.completionRequired);
      return;
    }
    actions.complete.mutate(completionPhotos, { onError: fail });
  }

  const providerActions =
    viewerRole === 'provider' ? (
      <>
        {data.status === 'scheduled' ? (
          <Button
            title={copy.schedule.markEnRoute}
            loading={actions.enRoute.isPending}
            onPress={() => actions.enRoute.mutate(data.id, { onError: fail })}
            leftIcon={<Ionicons name="car-outline" size={18} color={theme.colors.textOnPrimary} />}
          />
        ) : null}

        {data.status === 'en_route' ? (
          <Button
            title={copy.schedule.markArrived}
            loading={actions.arrived.isPending}
            onPress={() => actions.arrived.mutate(data.id, { onError: fail })}
            leftIcon={
              <Ionicons name="location-outline" size={18} color={theme.colors.textOnPrimary} />
            }
          />
        ) : null}

        {data.status === 'in_progress' ? (
          <View style={styles.section}>
            <PhotoPicker
              value={completionPhotos}
              onChange={setCompletionPhotos}
              max={10}
              label={copy.schedule.completionPhotos}
            />
            <Button
              title={copy.schedule.markCompleted}
              variant="accent"
              loading={actions.complete.isPending}
              onPress={complete}
            />
          </View>
        ) : null}
      </>
    ) : null;

  const canCancel =
    viewerRole === 'provider'
      ? data.status === 'scheduled' || data.status === 'en_route'
      : data.status === 'scheduled';

  return (
    <Screen contentStyle={styles.content}>
      <Card style={styles.windowCard} variant="accent">
        <Text variant="overline" color="primary">
          {copy.schedule.windowLabel.toUpperCase()}
        </Text>
        <Text variant="display" numeric>
          {formatWindow(data.window_start, data.window_end)}
        </Text>
        <Text variant="bodySm" color="textSecondary">
          {formatDayLong(data.window_start)}
        </Text>
        <Badge label={status.label} tone={status.tone} dot style={styles.statusBadge} />
      </Card>

      <View style={styles.section}>
        <SectionHeader title={copy.job.timeline} />
        <Card>
          <JobTimeline job={data} />
        </Card>
      </View>

      {counterpart ? (
        <View style={styles.section}>
          <SectionHeader title={viewerRole === 'client' ? copy.job.provider : copy.job.client} />
          <Card style={styles.personCard}>
            <Avatar name={counterpart.full_name} uri={counterpart.avatar_url} size={48} />
            <View style={styles.grow}>
              <Text variant="title">{counterpart.full_name}</Text>
              {counterpart.phone ? (
                <Text variant="bodySm" color="textSecondary" selectable>
                  {counterpart.phone}
                </Text>
              ) : null}
            </View>
          </Card>
        </View>
      ) : null}

      {request ? (
        <View style={styles.section}>
          <SectionHeader title={copy.request.detailTitle} />
          <Card style={styles.section}>
            <Text variant="title">{request.title}</Text>
            <Text variant="bodySm" color="textSecondary" selectable>
              {request.description}
            </Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <Text variant="bodySm" color="textSecondary" selectable style={styles.grow}>
                {request.address_text}
              </Text>
            </View>
          </Card>
        </View>
      ) : null}

      {quote ? (
        <View style={styles.section}>
          <SectionHeader title={copy.quote.listTitle} />
          <Card style={styles.section}>
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
          </Card>
        </View>
      ) : null}

      {photos.data && photos.data.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title={copy.schedule.completionPhotos} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
            {photos.data.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} accessibilityIgnoresInvertColors />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {providerActions}

      {viewerRole === 'client' && data.status === 'completed' ? (
        review ? (
          <Text variant="bodySm" color="textSecondary" center>
            {copy.job.reviewDone}
          </Text>
        ) : (
          <Button
            title={copy.job.reviewCta}
            variant="accent"
            onPress={() => router.push({ pathname: '/(client)/review/[id]', params: { id: data.id } })}
          />
        )
      ) : null}

      {canCancel ? (
        cancelling ? (
          <Card style={styles.section}>
            <Input
              label={copy.schedule.cancelReasonLabel}
              value={reason}
              onChangeText={setReason}
              error={reasonError}
              multiline
              maxLength={500}
            />
            <Button
              title={copy.schedule.cancelJob}
              variant="danger"
              loading={actions.cancel.isPending}
              onPress={confirmCancel}
            />
            <Button title={copy.common.back} variant="ghost" onPress={() => setCancelling(false)} />
          </Card>
        ) : (
          <Button
            title={viewerRole === 'provider' ? copy.schedule.cancelJob : copy.job.cancel}
            variant="ghost"
            onPress={() => setCancelling(true)}
          />
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  windowCard: { gap: 2 },
  statusBadge: { marginTop: theme.spacing.sm },
  section: { gap: theme.spacing.md },
  personCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.xs + 2 },
  photoRow: { gap: theme.spacing.sm },
  photo: {
    width: 132,
    height: 132,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surfaceMuted,
  },
  grow: { flex: 1 },
});
