import { Stack } from 'expo-router';

import { copy } from '@/lib/copy';
import { stackScreenOptions } from '@/lib/navigation';

/**
 * Client stack. The tab bar is one screen inside it, so every detail view
 * (request, job, review) pushes over the tabs with a real back button instead
 * of replacing the tab content.
 */
export default function ClientLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-request"
        options={{ presentation: 'modal', title: copy.newRequest.title }}
      />
      <Stack.Screen name="request/[id]" options={{ title: copy.request.detailTitle }} />
      <Stack.Screen name="job/[id]" options={{ title: copy.job.detailTitle }} />
      <Stack.Screen
        name="review/[id]"
        options={{ presentation: 'modal', title: copy.review.title }}
      />
      <Stack.Screen name="edit-profile" options={{ title: copy.profile.editTitle }} />
    </Stack>
  );
}
