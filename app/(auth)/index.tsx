import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, IconTile, Screen, Text } from '@/components';
import { copy } from '@/lib/copy';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';
import type { UserRole } from '@/types/database';

const VALUE_PROPS: Array<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string }> = [
  { icon: 'chatbubbles-outline', label: copy.auth.valueNoCalls },
  { icon: 'time-outline', label: copy.auth.valueWindows },
  { icon: 'shield-checkmark-outline', label: copy.auth.valueVerified },
];

/** Role selection — first screen. Role is fixed at profile creation. */
export default function WelcomeScreen() {
  const router = useRouter();
  const setPendingRole = useSessionStore((state) => state.setPendingRole);

  function pickRole(role: UserRole) {
    setPendingRole(role);
    router.push('/(auth)/sign-in');
  }

  return (
    <Screen bottomInset contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Ionicons name="hammer" size={26} color={theme.colors.textOnPrimary} />
        </View>
        <Text variant="display">{copy.common.appName}</Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          {copy.auth.welcomeSubtitle}
        </Text>
      </View>

      <View style={styles.values}>
        {VALUE_PROPS.map((prop) => (
          <View key={prop.label} style={styles.valueRow}>
            <Ionicons name={prop.icon} size={18} color={theme.colors.primary} />
            <Text variant="bodySm" color="textSecondary">
              {prop.label}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="h3">{copy.auth.roleQuestion}</Text>

      <Card onPress={() => pickRole('client')} style={styles.roleCard}>
        <IconTile name="home-outline" size="lg" />
        <View style={styles.roleText}>
          <Text variant="title">{copy.auth.roleClient}</Text>
          <Text variant="bodySm" color="textSecondary">
            {copy.auth.roleClientDetail}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
      </Card>

      <Card onPress={() => pickRole('provider')} style={styles.roleCard}>
        <IconTile
          name="hammer-outline"
          size="lg"
          color={theme.colors.accent}
          background={theme.colors.accentTint}
        />
        <View style={styles.roleText}>
          <Text variant="title">{copy.auth.roleProvider}</Text>
          <Text variant="bodySm" color="textSecondary">
            {copy.auth.roleProviderDetail}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.lg, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: theme.spacing.sm, paddingTop: theme.spacing.xxl },
  mark: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    boxShadow: theme.elevation.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: { textAlign: 'center', maxWidth: 340 },
  values: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.primarySurface,
  },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  roleText: { flex: 1, gap: 2 },
});
