import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, Input, RatingStars, Screen, SkeletonCard, Text } from '@/components';
import { useCreateReview, useJob } from '@/features/jobs/hooks';
import { copy } from '@/lib/copy';
import { theme } from '@/theme';

/**
 * Quality and punctuality are rated separately — that split is the product's
 * differentiator, and it only works if the form refuses to collapse them into
 * one number.
 */
export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const job = useJob(id);
  const create = useCreateReview(id);

  const [rating, setRating] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [comment, setComment] = useState('');

  if (job.isPending) {
    return (
      <Screen>
        <SkeletonCard />
      </Screen>
    );
  }

  const providerId = job.data?.provider_id;

  function submit() {
    if (rating < 1 || punctuality < 1) {
      Alert.alert(copy.common.appName, copy.review.ratingRequired);
      return;
    }
    if (!providerId) return;

    create.mutate(
      { providerId, rating, punctualityRating: punctuality, comment },
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
      footer={
        <Button
          title={copy.review.submit}
          variant="accent"
          loading={create.isPending}
          onPress={submit}
        />
      }
    >
      <Card style={styles.card}>
        <Text variant="h3">{copy.review.qualityLabel}</Text>
        <RatingStars value={rating} onChange={setRating} size={34} />
      </Card>

      <Card style={styles.card}>
        <Text variant="h3">{copy.review.punctualityLabel}</Text>
        <RatingStars value={punctuality} onChange={setPunctuality} size={34} />
      </Card>

      <View>
        <Input
          label={copy.review.commentLabel}
          placeholder={copy.review.commentPlaceholder}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={1000}
          counter
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.lg },
  card: { gap: theme.spacing.md, alignItems: 'flex-start' },
});
