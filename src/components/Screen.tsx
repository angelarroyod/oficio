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
  /** Pinned action bar at the bottom (wizard CTAs, accept/send actions). */
  footer?: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/**
 * Base screen chrome: background, safe areas, keyboard avoidance and the
 * global offline banner. Content is capped at layout.maxContentWidth and
 * centered so the app stays composed on tablets and the web preview.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  bottomInset = false,
  footer,
  style,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const paddingBottom = bottomInset ? insets.bottom + theme.spacing.lg : theme.spacing.lg;

  const inner = scroll ? (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
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
        {footer ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.md }]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  background: { backgroundColor: theme.colors.background },
  content: {
    flexGrow: 1,
    paddingTop: theme.spacing.lg,
    width: '100%',
    maxWidth: theme.layout.maxContentWidth,
    alignSelf: 'center',
  },
  padded: { paddingHorizontal: theme.layout.screenPadding },
  footer: {
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
