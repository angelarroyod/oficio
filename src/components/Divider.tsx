import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@/theme';

/** Hairline rule. Spacing is the caller's business; this only draws the line. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.line, style]} />;
}

const styles = StyleSheet.create({
  line: { height: theme.layout.hairline, backgroundColor: theme.colors.border },
});
