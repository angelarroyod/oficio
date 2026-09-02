import { Image } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
};

/** Initials avatar, photo when one exists. Deterministic tint per person. */
export function Avatar({ name, uri, size = 44 }: Props) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityIgnoresInvertColors
        style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text variant={size >= 56 ? 'h3' : 'label'} color="primary">
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: theme.colors.surfaceMuted },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryTint,
  },
});
