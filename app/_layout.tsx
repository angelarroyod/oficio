import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthState, useSessionListener } from '@/features/auth/useSession';
import { configureOnlineManager } from '@/lib/network';
import { asyncStoragePersister, CACHE_BUSTER, queryClient } from '@/lib/queryClient';

configureOnlineManager();

/**
 * Route guards are declarative: Stack.Protected includes each branch only
 * when its guard holds, so an unauthenticated user cannot navigate into the
 * app and a client can never land in provider tabs (and vice versa).
 */
function RootNavigator() {
  useSessionListener();
  const { restoring, signedIn, profile, role } = useAuthState();

  // Keep the splash visible while the persisted session is restored.
  if (restoring) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && !profile}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && role === 'client'}>
        <Stack.Screen name="(client)" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && role === 'provider'}>
        <Stack.Screen name="(provider)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, buster: CACHE_BUSTER }}
        >
          <StatusBar style="dark" />
          <RootNavigator />
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
