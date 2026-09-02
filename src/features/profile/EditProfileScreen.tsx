import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet } from 'react-native';
import { z } from 'zod';

import { Button, Input, Screen } from '@/components';
import { useUpdateProfile } from '@/features/providers/hooks';
import { copy } from '@/lib/copy';
import { fullNameSchema, phoneSchema } from '@/lib/zod';
import { useSessionStore } from '@/store/session';
import { theme } from '@/theme';

const formSchema = z.object({
  full_name: fullNameSchema,
  phone: phoneSchema,
  city: z.string().trim().max(80),
  colonia: z.string().trim().max(80),
});

type FormValues = z.input<typeof formSchema>;

/** Identity fields both roles share. Role itself is immutable (DB trigger). */
export function EditProfileScreen() {
  const router = useRouter();
  const profile = useSessionStore((state) => state.profile);
  const update = useUpdateProfile();

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      city: profile?.city ?? '',
      colonia: profile?.colonia ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    const parsed = formSchema.parse(values);
    update.mutate(
      {
        full_name: parsed.full_name,
        phone: parsed.phone || null,
        city: parsed.city || null,
        colonia: parsed.colonia || null,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(copy.common.appName, copy.common.genericError),
      },
    );
  });

  return (
    <Screen
      bottomInset
      contentStyle={styles.content}
      footer={<Button title={copy.common.save} loading={update.isPending} onPress={onSubmit} />}
    >
      <Controller
        control={control}
        name="full_name"
        render={({ field, fieldState }) => (
          <Input
            label={copy.auth.fullNameLabel}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <Input
            label={copy.profile.phoneLabel}
            placeholder={copy.profile.phonePlaceholder}
            keyboardType="phone-pad"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="city"
        render={({ field, fieldState }) => (
          <Input
            label={copy.profile.cityLabel}
            placeholder={copy.profile.cityPlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="colonia"
        render={({ field, fieldState }) => (
          <Input
            label={copy.profile.coloniaLabel}
            placeholder={copy.profile.coloniaPlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: theme.spacing.lg },
});
