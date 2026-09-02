import { forwardRef, useState, type ReactNode } from 'react';
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
  /** Node rendered inside the field, before the text (icon, "$"). */
  prefix?: ReactNode;
  /** Node rendered inside the field, after the text (unit, action). */
  suffix?: ReactNode;
  /** Show a "used / maxLength" counter under the field. */
  counter?: boolean;
  containerStyle?: ViewStyle;
};

/**
 * Form input with label, hint and error slots. Designed to pair with
 * react-hook-form Controllers: pass fieldState.error?.message as `error`.
 * Focus is shown with a tinted ring rather than a color swap alone, so the
 * active field is obvious without relying on hue.
 */
export const Input = forwardRef<TextInput, Props>(function Input(
  {
    label,
    error,
    hint,
    prefix,
    suffix,
    counter,
    containerStyle,
    style,
    multiline,
    maxLength,
    value,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const helper = error ?? hint;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.focused,
          Boolean(error) && styles.errored,
        ]}
      >
        {prefix}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.textTertiary}
          multiline={multiline}
          maxLength={maxLength}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
          {...rest}
        />
        {suffix}
      </View>

      {helper || (counter && maxLength) ? (
        <View style={styles.helperRow}>
          <Text
            variant="caption"
            color={error ? 'danger' : 'textSecondary'}
            style={styles.helperText}
          >
            {helper ?? ''}
          </Text>
          {counter && maxLength ? (
            <Text variant="caption" color="textTertiary" numeric>
              {(value?.length ?? 0) + '/' + maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: theme.spacing.xs + 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.layout.minTouchTarget + 4,
    borderWidth: theme.layout.hairline,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  fieldMultiline: { alignItems: 'flex-start', minHeight: 112, paddingVertical: theme.spacing.sm },
  focused: {
    borderColor: theme.colors.primary,
    boxShadow: '0px 0px 0px 3px rgba(15, 95, 166, 0.14)',
  },
  errored: {
    borderColor: theme.colors.danger,
    boxShadow: '0px 0px 0px 3px rgba(181, 52, 42, 0.12)',
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text,
  },
  inputMultiline: { textAlignVertical: 'top', minHeight: 96 },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs + 2,
  },
  helperText: { flex: 1 },
});
