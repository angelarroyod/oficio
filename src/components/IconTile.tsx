import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  /** Foreground (icon) color. */
  color?: string;
  /** Tinted square behind the icon. */
  background?: string;
  size?: Size;
  style?: StyleProp<ViewStyle>;
};

const bySize: Record<Size, { box: number; icon: number; radius: number }> = {
  sm: { box: 32, icon: 16, radius: theme.radius.sm },
  md: { box: 44, icon: 22, radius: theme.radius.md },
  lg: { box: 56, icon: 28, radius: theme.radius.lg },
};

/**
 * Rounded tinted square holding one icon. Carries trade identity in feeds and
 * lists — a plumbing card is recognizable before its label is read.
 */
export function IconTile({
  name,
  color = theme.colors.primary,
  background = theme.colors.primaryTint,
  size = 'md',
  style,
}: Props) {
  const s = bySize[size];
  return (
    <View
      style={[
        styles.tile,
        { width: s.box, height: s.box, borderRadius: s.radius, backgroundColor: background },
        style,
      ]}
    >
      <Ionicons name={name} size={s.icon} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', borderCurve: 'continuous' },
});
