import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Screen, Text } from '@/components';
import { signOut } from '@/features/auth/api';
import { copy } from '@/lib/copy';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';

/**
 * Shared profile shell for both roles. Sprint 1 scope: identity summary +
 * sign out. Privacy, addresses, account deletion and provider metrics land
 * in Sprints 3–4.
 */
export function ProfileScreenBase() {
  const profile = useSessionStore((s) => s.profile);
  const reset = useSessionStore((s) => s.reset);
  const [busy, setBusy] = useState(false);

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

  const roleLabel =
    profile.role === 'client' ? copy.auth.roleClient : copy.auth.roleProvider;

  return (
    <Screen>
      <Card style={styles.card}>
        <Text variant="h2">{profile.full_name}</Text>
        <Badge label={roleLabel} tone="primary" />
      </Card>

      <View style={styles.section}>
        <Text variant="bodySm" color="textSecondary">
          {copy.placeholders.profile}
        </Text>
      </View>

      <Button
        title={copy.auth.signOut}
        variant="secondary"
        onPress={onSignOut}
        loading={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  section: { marginBottom: theme.spacing.xl },
});
