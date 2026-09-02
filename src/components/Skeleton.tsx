import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// The native animated module is absent on web; opting in there only logs a warning.
const USE_NATIVE_DRIVER = process.env.EXPO_OS !== 'web';

import { theme } from '@/theme';

type Props = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pulsing placeholder. Loading lists render their real shape in grey rather
 * than a spinner, so the layout does not jump when data lands.
 */
export function Skeleton({ width = '100%', height = 16, radius = theme.radius.sm, style }: Props) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: theme.motion.slow,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: theme.motion.slow,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.block,
        { width: width as ViewStyle['width'], height, borderRadius: radius, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Card-shaped skeleton used by every list while its first page loads. */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} radius={theme.radius.md} />
        <View style={styles.grow}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} style={styles.gap} />
        </View>
      </View>
      <Skeleton height={12} style={styles.gap} />
      <Skeleton width="55%" height={12} style={styles.gap} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: theme.colors.surfaceSunken },
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  row: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  grow: { flex: 1 },
  gap: { marginTop: theme.spacing.sm },
});
