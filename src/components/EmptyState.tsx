import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Empty and zero-result states. Always says what to do next — an empty list
 * with no exit is the fastest way to lose a first-time user.
 */
export function EmptyState({ icon, title, body, actionLabel, onAction, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.halo}>
        <Ionicons name={icon} size={30} color={theme.colors.primary} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {body ? (
        <Text variant="bodySm" color="textSecondary" center style={styles.body}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  halo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryTint,
    marginBottom: theme.spacing.xs,
  },
  body: { maxWidth: 320 },
  action: { marginTop: theme.spacing.md },
});
