import { StyleSheet, View } from 'react-native';

import { copy } from '@/lib/copy';
import { useOnlineStatus } from '@/lib/network';
import { theme } from '@/theme';

import { Text } from './Text';

/**
 * Persistent connectivity notice. Offline is the normal case for this trade
 * (basements, rooftops) — the banner informs without blocking interaction.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <View accessibilityLiveRegion="polite" style={styles.banner}>
      <Text variant="caption" color="warning" center>
        {copy.common.offlineBanner}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.warningTint,
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.lg,
  },
});
