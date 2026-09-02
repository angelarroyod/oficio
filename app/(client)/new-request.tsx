import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  Chip,
  IconTile,
  Input,
  PhotoPicker,
  ProgressSteps,
  Screen,
  Text,
} from '@/components';
import { useCreateRequest } from '@/features/requests/hooks';
import { copy } from '@/lib/copy';
import { TRADES, URGENCIES, VISIT_TYPES, tradeMeta } from '@/lib/domain';
import { resolveCurrentPlace } from '@/lib/location';
import { theme } from '@/theme';
import {
  addressSchema,
  requestDescriptionSchema,
  requestTitleSchema,
} from '@/lib/zod';
import type { RequestUrgency, TradeType, VisitType } from '@/types/database';

const STEP_LABELS = [
  copy.newRequest.stepTrade,
  copy.newRequest.stepDetails,
  copy.newRequest.stepLocation,
  copy.newRequest.stepReview,
];

/**
 * Four steps, one decision each. A single long form is the usual way to build
 * this and the usual way to lose people at the photo field — splitting it
 * means every screen has one obvious next action and nothing else.
 */
export default function NewRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ trade?: TradeType }>();
  const create = useCreateRequest();

  const [step, setStep] = useState(0);
  const [trade, setTrade] = useState<TradeType | null>(params.trade ?? null);
  const [visitType, setVisitType] = useState<VisitType>('full_service');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [addressText, setAddressText] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [urgency, setUrgency] = useState<RequestUrgency>('flexible');
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string; address?: string }>({});

  async function useMyLocation() {
    setLocating(true);
    try {
      const place = await resolveCurrentPlace();
      if (!place) {
        Alert.alert(copy.common.appName, copy.newRequest.locationDenied);
        return;
      }
      setCoords({ lat: place.lat, lng: place.lng });
      if (place.addressText && !addressText) setAddressText(place.addressText);
    } catch {
      Alert.alert(copy.common.appName, copy.newRequest.locationDenied);
    } finally {
      setLocating(false);
    }
  }

  function validateStep(): boolean {
    if (step === 1) {
      const titleResult = requestTitleSchema.safeParse(title);
      const descriptionResult = requestDescriptionSchema.safeParse(description);
      setErrors({
        title: titleResult.success ? undefined : titleResult.error.issues[0]?.message,
        description: descriptionResult.success
          ? undefined
          : descriptionResult.error.issues[0]?.message,
      });
      return titleResult.success && descriptionResult.success;
    }
    if (step === 2) {
      const addressResult = addressSchema.safeParse(addressText);
      setErrors({ address: addressResult.success ? undefined : addressResult.error.issues[0]?.message });
      if (!coords) {
        Alert.alert(copy.common.appName, copy.newRequest.locationRequired);
        return false;
      }
      return addressResult.success;
    }
    return true;
  }

  function next() {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
  }

  function publish() {
    if (!trade || !coords) return;
    create.mutate(
      {
        trade,
        visitType,
        title: title.trim(),
        description: description.trim(),
        addressText: addressText.trim(),
        lat: coords.lat,
        lng: coords.lng,
        urgency,
        photoUris,
      },
      {
        onSuccess: (request) => {
          router.replace({ pathname: '/(client)/request/[id]', params: { id: request.id } });
        },
        onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
      },
    );
  }

  const canAdvance = step === 0 ? Boolean(trade) : true;
  const isLast = step === STEP_LABELS.length - 1;

  return (
    <Screen
      bottomInset
      contentStyle={styles.content}
      footer={
        <View style={styles.footerRow}>
          {step > 0 ? (
            <Button
              title={copy.common.back}
              variant="ghost"
              fullWidth={false}
              onPress={() => setStep((current) => current - 1)}
              style={styles.backButton}
            />
          ) : null}
          <Button
            title={isLast ? copy.newRequest.publish : copy.common.continue}
            variant={isLast ? 'accent' : 'primary'}
            disabled={!canAdvance}
            loading={create.isPending}
            onPress={isLast ? publish : next}
            style={styles.grow}
          />
        </View>
      }
    >
      <ProgressSteps
        current={step + 1}
        total={STEP_LABELS.length}
        label={STEP_LABELS[step] ?? ''}
      />

      {step === 0 ? (
        <View style={styles.section}>
          <Text variant="h2">{copy.newRequest.tradeQuestion}</Text>
          <View style={styles.tradeGrid}>
            {TRADES.map((item) => {
              const selected = trade === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTrade(item.value)}
                  style={({ pressed }) => [
                    styles.tradeCard,
                    selected && styles.tradeCardSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <IconTile name={item.icon} color={item.fg} background={item.bg} size="lg" />
                  <Text variant="label" center>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="h3" style={styles.subHeading}>
            {copy.newRequest.visitQuestion}
          </Text>
          {VISIT_TYPES.map((option) => (
            <Card
              key={option.value}
              onPress={() => setVisitType(option.value)}
              variant={visitType === option.value ? 'accent' : 'outline'}
              style={styles.optionCard}
            >
              <View style={styles.grow}>
                <Text variant="title">{option.label}</Text>
                <Text variant="bodySm" color="textSecondary">
                  {option.hint}
                </Text>
              </View>
              {visitType === option.value ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Input
            label={copy.newRequest.titleLabel}
            placeholder={copy.newRequest.titlePlaceholder}
            value={title}
            onChangeText={setTitle}
            error={errors.title}
            maxLength={120}
          />
          <Input
            label={copy.newRequest.descriptionLabel}
            placeholder={copy.newRequest.descriptionPlaceholder}
            value={description}
            onChangeText={setDescription}
            error={errors.description}
            multiline
            maxLength={2000}
            counter
          />
          <PhotoPicker
            value={photoUris}
            onChange={setPhotoUris}
            max={6}
            label={copy.newRequest.photosLabel}
            hint={copy.newRequest.photosHint}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Input
            label={copy.newRequest.addressLabel}
            placeholder={copy.newRequest.addressPlaceholder}
            value={addressText}
            onChangeText={setAddressText}
            error={errors.address}
            multiline
          />

          <Button
            title={locating ? copy.newRequest.locating : copy.newRequest.useMyLocation}
            variant="secondary"
            loading={locating}
            onPress={() => void useMyLocation()}
            leftIcon={<Ionicons name="navigate-outline" size={18} color={theme.colors.primary} />}
          />

          {coords ? (
            <View style={styles.locationOk}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text variant="bodySm" color="success">
                {copy.newRequest.locationSet}
              </Text>
            </View>
          ) : (
            <Text variant="caption" color="textSecondary">
              {copy.newRequest.locationRequired}
            </Text>
          )}

          <Text variant="h3" style={styles.subHeading}>
            {copy.newRequest.urgencyQuestion}
          </Text>
          {URGENCIES.map((option) => (
            <Card
              key={option.value}
              onPress={() => setUrgency(option.value)}
              variant={urgency === option.value ? 'accent' : 'outline'}
              style={styles.optionCard}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={urgency === option.value ? theme.colors.primary : theme.colors.textTertiary}
              />
              <View style={styles.grow}>
                <Text variant="title">{option.label}</Text>
                <Text variant="bodySm" color="textSecondary">
                  {option.hint}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {step === 3 && trade ? (
        <View style={styles.section}>
          <Text variant="h2">{copy.newRequest.reviewTitle}</Text>
          <Card style={styles.reviewCard}>
            <View style={styles.headerRow}>
              <IconTile
                name={tradeMeta(trade).icon}
                color={tradeMeta(trade).fg}
                background={tradeMeta(trade).bg}
              />
              <View style={styles.grow}>
                <Text variant="title">{title}</Text>
                <Text variant="caption" color="textSecondary">
                  {tradeMeta(trade).label + ' · ' + copy.visitType[visitType]}
                </Text>
              </View>
            </View>
            <Text variant="bodySm" color="textSecondary">
              {description}
            </Text>
            <View style={styles.chipRow}>
              <Chip label={copy.urgency[urgency]} selected />
              <Chip label={copy.photos.hint(photoUris.length, 6)} />
            </View>
            <Text variant="bodySm" color="textSecondary">
              {addressText}
            </Text>
          </Card>
          <Text variant="caption" color="textSecondary">
            {copy.newRequest.reviewHint}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.xl },
  section: { gap: theme.spacing.md },
  subHeading: { marginTop: theme.spacing.sm },
  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  tradeCard: {
    width: 96,
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tradeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySurface,
  },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  reviewCard: { gap: theme.spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  locationOk: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs + 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  backButton: { minWidth: 88 },
  grow: { flex: 1 },
  pressed: { opacity: 0.8 },
});
