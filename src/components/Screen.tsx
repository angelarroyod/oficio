import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

import { OfflineBanner } from './OfflineBanner';

type Props = {
  children: ReactNode;
  /** Scrollable content (default). Set false for screens that manage their own lists. */
  scroll?: boolean;
  /** Apply horizontal screen padding (default true). */
  padded?: boolean;
  /** Include bottom safe-area inset — use on screens without a tab bar. */
  bottomInset?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * Base screen chrome: background, safe areas, keyboard avoidance and the
 * global offline banner. Tab screens get top inset from the navigator header
 * when present; standalone screens handle their own via safe-area insets.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  bottomInset = false,
  style,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingBottom = bottomInset ? insets.bottom + theme.spacing.lg : theme.spacing.lg;

  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        padded && styles.padded,
        { paddingBottom },
        contentStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, { paddingBottom }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.fill, styles.background, style]}>
      <OfflineBanner />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  background: { backgroundColor: theme.colors.background },
  content: { flexGrow: 1, paddingTop: theme.spacing.lg },
  padded: { paddingHorizontal: theme.layout.screenPadding },
});
