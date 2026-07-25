import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components';
import { copy } from '@/lib/copy';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';
import type { UserRole } from '@/types/database';

/** Role selection — first screen. Role is fixed at profile creation. */
export default function WelcomeScreen() {
  const router = useRouter();
  const setPendingRole = useSessionStore((s) => s.setPendingRole);

  function pickRole(role: UserRole) {
    setPendingRole(role);
    router.push('/(auth)/sign-in');
  }

  return (
    <Screen bottomInset>
      <View style={styles.hero}>
        <Text variant="display" center>
          {copy.common.appName}
        </Text>
        <Text variant="body" color="textSecondary" center style={styles.subtitle}>
          {copy.auth.welcomeSubtitle}
        </Text>
      </View>

      <Text variant="h3" style={styles.question}>
        {copy.auth.roleQuestion}
      </Text>

      <Card onPress={() => pickRole('client')} style={styles.roleCard}>
        <Text variant="title">{copy.auth.roleClient}</Text>
        <Text variant="bodySm" color="textSecondary">
          {copy.auth.roleClientDetail}
        </Text>
      </Card>

      <Card onPress={() => pickRole('provider')} style={styles.roleCard}>
        <Text variant="title">{copy.auth.roleProvider}</Text>
        <Text variant="bodySm" color="textSecondary">
          {copy.auth.roleProviderDetail}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  subtitle: { paddingHorizontal: theme.spacing.lg },
  question: { marginBottom: theme.spacing.lg },
  roleCard: { marginBottom: theme.spacing.md, gap: theme.spacing.xs },
});
