import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/theme';

import { Text } from './Text';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
};

/**
 * Form input with label, hint and error slots. Designed to pair with
 * react-hook-form Controllers: pass fieldState.error?.message as `error`.
 */
export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, hint, containerStyle, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.textTertiary}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          Boolean(error) && styles.errored,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textSecondary" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: theme.spacing.xs },
  input: {
    minHeight: theme.layout.minTouchTarget,
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  focused: { borderColor: theme.colors.primary },
  errored: { borderColor: theme.colors.danger },
  helper: { marginTop: theme.spacing.xs },
});
