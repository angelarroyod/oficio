import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

/**
 * Offline strategy (locked in design):
 *  - reads: cached to AsyncStorage and served while offline (24h gcTime)
 *  - writes: networkMode 'offlineFirst' pauses mutations offline; TanStack
 *    resumes them on reconnect (configureOnlineManager in lib/network.ts).
 * No custom sync/conflict engine in MVP.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'oficio-query-cache',
  throttleTime: 2_000,
});

/** Bump when cached shapes change incompatibly — invalidates persisted cache. */
export const CACHE_BUSTER = 'v1';
