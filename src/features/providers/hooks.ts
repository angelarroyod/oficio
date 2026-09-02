import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';
import { useSessionStore } from '@/store/session';
import type { FinanceEntryType, Profile } from '@/types/database';

import {
  createFinanceEntry,
  getProviderDetails,
  listFinanceEntries,
  listProviderReviews,
  updateProfile,
  updateProviderDetails,
  type ProviderSetupInput,
} from './api';

export function useProviderDetails() {
  const userId = useSessionStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: qk.provider.details(userId ?? 'anon'),
    queryFn: () => getProviderDetails(userId!),
    enabled: Boolean(userId),
  });
}

export function useUpdateProviderDetails() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: Omit<ProviderSetupInput, 'userId'>) =>
      updateProviderDetails({ ...input, userId: userId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.provider.details(userId ?? 'anon') });
      // Trades and radius decide what the feed policy returns.
      void queryClient.invalidateQueries({ queryKey: qk.requests.opportunities() });
    },
  });
}

export function useProviderReviews(providerId: string | undefined) {
  return useQuery({
    queryKey: qk.provider.reviews(providerId ?? 'anon'),
    queryFn: () => listProviderReviews(providerId!),
    enabled: Boolean(providerId),
  });
}

export function useFinanceEntries(enabled: boolean) {
  const userId = useSessionStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: qk.provider.finance(userId ?? 'anon'),
    queryFn: () => listFinanceEntries(userId!),
    enabled: enabled && Boolean(userId),
  });
}

export function useCreateFinanceEntry() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: { type: FinanceEntryType; amount: number; category: string }) =>
      createFinanceEntry({ ...input, providerId: userId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.provider.finance(userId ?? 'anon') });
    },
  });
}

/** Profile edits keep the Zustand store in sync — guards read role from it. */
export function useUpdateProfile() {
  const userId = useSessionStore((state) => state.session?.user.id);
  const setProfile = useSessionStore((state) => state.setProfile);

  return useMutation({
    mutationFn: (patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'colonia'>>) =>
      updateProfile(userId!, patch),
    onSuccess: (profile) => setProfile(profile),
  });
}
