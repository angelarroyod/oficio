import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet } from 'react-native';
import { z } from 'zod';

import { Button, Card, IconTile, Input, Screen, Text } from '@/components';
import { createProfile } from '@/features/auth/api';
import { copy } from '@/lib/copy';
import { fullNameSchema } from '@/lib/zod';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';
import type { UserRole } from '@/types/database';

const formSchema = z.object({ fullName: fullNameSchema });
type FormValues = z.infer<typeof formSchema>;

/**
 * Shown when a session exists but no profile row does (fresh sign-up, or the
 * user came in through OAuth without passing the welcome screen). Confirms
 * role — immutable afterwards — and captures the display name.
 */
export default function CompleteProfileScreen() {
  const session = useSessionStore((s) => s.session);
  const pendingRole = useSessionStore((s) => s.pendingRole);
  const setProfile = useSessionStore((s) => s.setProfile);
  const [role, setRole] = useState<UserRole | null>(pendingRole);
  const [busy, setBusy] = useState(false);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: '' },
  });

  const onSubmit = handleSubmit(async ({ fullName }) => {
    if (!session || !role) return;
    setBusy(true);
    try {
      const profile = await createProfile({
        userId: session.user.id,
        role,
        fullName,
      });
      setProfile(profile);
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
      setBusy(false);
    }
  });

  return (
    <Screen bottomInset>
      <Text variant="h1" style={styles.title}>
        {copy.auth.completeProfileTitle}
      </Text>
      <Text variant="bodySm" color="textSecondary" style={styles.lead}>
        {copy.auth.completeProfileSubtitle}
      </Text>

      {!pendingRole ? (
        <>
          <Text variant="h3" style={styles.sectionTitle}>
            {copy.auth.roleQuestion}
          </Text>
          <Card
            onPress={() => setRole('client')}
            variant={role === 'client' ? 'accent' : 'outline'}
            style={styles.roleCard}
          >
            <IconTile name="home-outline" />
            <Text variant="title">{copy.auth.roleClient}</Text>
          </Card>
          <Card
            onPress={() => setRole('provider')}
            variant={role === 'provider' ? 'accent' : 'outline'}
            style={styles.roleCard}
          >
            <IconTile
              name="hammer-outline"
              color={theme.colors.accent}
              background={theme.colors.accentTint}
            />
            <Text variant="title">{copy.auth.roleProvider}</Text>
          </Card>
        </>
      ) : null}

      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <Input
            label={copy.auth.fullNameLabel}
            placeholder={copy.auth.fullNamePlaceholder}
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            containerStyle={styles.field}
          />
        )}
      />

      <Button
        title={copy.common.continue}
        size="lg"
        onPress={onSubmit}
        loading={busy}
        disabled={!role}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs },
  lead: { marginBottom: theme.spacing.xl },
  sectionTitle: { marginBottom: theme.spacing.md },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  field: { marginTop: theme.spacing.md, marginBottom: theme.spacing.lg },
});
