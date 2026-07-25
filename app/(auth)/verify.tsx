import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet } from 'react-native';
import { z } from 'zod';

import { Button, Input, Screen, Text } from '@/components';
import { requestEmailOtp, verifyEmailOtp } from '@/features/auth/api';
import { copy } from '@/lib/copy';
import { otpCodeSchema } from '@/lib/zod';
import { theme } from '@/theme';

const formSchema = z.object({ code: otpCodeSchema });
type FormValues = z.infer<typeof formSchema>;

/**
 * OTP entry. On success the auth listener updates the session store and the
 * root guards route to onboarding or the role's tabs — no manual navigation.
 */
export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [busy, setBusy] = useState(false);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = handleSubmit(async ({ code }) => {
    if (!email) return;
    setBusy(true);
    try {
      await verifyEmailOtp(email, code);
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
      setBusy(false);
    }
  });

  async function onResend() {
    if (!email) return;
    try {
      await requestEmailOtp(email);
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
    }
  }

  return (
    <Screen bottomInset>
      <Text variant="h1" style={styles.title}>
        {copy.auth.codeSentTitle}
      </Text>
      <Text variant="body" color="textSecondary" style={styles.subtitle}>
        {copy.auth.codeSentBody(email ?? '')}
      </Text>

      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <Input
            label={copy.auth.codeLabel}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            containerStyle={styles.field}
          />
        )}
      />

      <Button title={copy.auth.verify} onPress={onSubmit} loading={busy} />
      <Button
        title={copy.auth.resendCode}
        variant="ghost"
        onPress={onResend}
        disabled={busy}
        style={styles.resend}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  subtitle: { marginBottom: theme.spacing.xl },
  field: { marginBottom: theme.spacing.lg },
  resend: { marginTop: theme.spacing.sm },
});
