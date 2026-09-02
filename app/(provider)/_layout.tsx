import { Stack } from 'expo-router';

import { copy } from '@/lib/copy';
import { stackScreenOptions } from '@/lib/navigation';

export default function ProviderLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-quote"
        options={{ presentation: 'modal', title: copy.quote.builderTitle }}
      />
      <Stack.Screen name="job/[id]" options={{ title: copy.job.detailTitle }} />
      <Stack.Screen name="setup" options={{ title: copy.profile.providerSetupTitle }} />
      <Stack.Screen name="edit-profile" options={{ title: copy.profile.editTitle }} />
    </Stack>
  );
}
