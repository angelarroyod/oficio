import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Input, Screen, Text } from '@/components';
import {
  isAppleSignInAvailable,
  requestEmailOtp,
  signInWithApple,
  signInWithGoogle,
} from '@/features/auth/api';
import { copy } from '@/lib/copy';
import { emailSchema } from '@/lib/zod';
import { theme } from '@/theme';

const formSchema = z.object({ email: emailSchema });
type FormValues = z.infer<typeof formSchema>;

export default function SignInScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState<'email' | 'google' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Apple sign-in is a native capability: absent in Expo Go, present on EAS builds.
  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  const onEmailSubmit = handleSubmit(async ({ email }) => {
    setBusy('email');
    try {
      await requestEmailOtp(email);
      router.push({ pathname: '/(auth)/verify', params: { email } });
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
    } finally {
      setBusy(null);
    }
  });

  async function onGoogle() {
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
    } finally {
      setBusy(null);
    }
  }

  async function onApple() {
    setBusy('apple');
    try {
      await signInWithApple();
    } catch {
      Alert.alert(copy.common.appName, copy.common.genericError);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen bottomInset>
      <Text variant="h1" style={styles.title}>
        {copy.auth.welcomeTitle}
      </Text>
      <Text variant="bodySm" color="textSecondary" style={styles.lead}>
        {copy.auth.welcomeSubtitle}
      </Text>

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label={copy.auth.emailLabel}
            placeholder={copy.auth.emailPlaceholder}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            containerStyle={styles.field}
          />
        )}
      />

      <Button
        title={copy.auth.sendCode}
        size="lg"
        onPress={onEmailSubmit}
        loading={busy === 'email'}
        disabled={busy !== null}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text variant="caption" color="textTertiary">
          {copy.auth.orDivider}
        </Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        title={copy.auth.googleSignIn}
        variant="secondary"
        leftIcon={<Ionicons name="logo-google" size={18} color={theme.colors.primary} />}
        onPress={onGoogle}
        loading={busy === 'google'}
        disabled={busy !== null}
        style={styles.socialButton}
      />

      {appleAvailable ? (
        <Button
          title={copy.auth.appleSignIn}
          variant="secondary"
          leftIcon={<Ionicons name="logo-apple" size={18} color={theme.colors.primary} />}
          onPress={onApple}
          loading={busy === 'apple'}
          disabled={busy !== null}
          style={styles.socialButton}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.xs },
  lead: { marginBottom: theme.spacing.xl },
  field: { marginBottom: theme.spacing.lg },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: theme.layout.hairline,
    backgroundColor: theme.colors.border,
  },
  socialButton: { marginBottom: theme.spacing.md },
});
