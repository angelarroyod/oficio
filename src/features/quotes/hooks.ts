import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';
import { useSessionStore } from '@/store/session';

import { acceptQuote, createQuote, listMyQuotes, withdrawQuote, type CreateQuoteInput } from './api';

export function useMyQuotes() {
  const userId = useSessionStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: qk.quotes.mine(userId ?? 'anon'),
    queryFn: () => listMyQuotes(userId!),
    enabled: Boolean(userId),
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: Omit<CreateQuoteInput, 'providerId'>) =>
      createQuote({ ...input, providerId: userId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.quotes.mine(userId ?? 'anon') });
      void queryClient.invalidateQueries({ queryKey: qk.requests.opportunities() });
    },
  });
}

export function useWithdrawQuote() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (id: string) => withdrawQuote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.quotes.mine(userId ?? 'anon') });
    },
  });
}

export function useAcceptQuote(requestId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: { quoteId: string; windowStart: Date; windowEnd: Date }) =>
      acceptQuote(input.quoteId, input.windowStart, input.windowEnd),
    onSuccess: () => {
      // Accepting rewrites the request, every sibling quote and the job list.
      void queryClient.invalidateQueries({ queryKey: qk.requests.mine(userId ?? 'anon') });
      void queryClient.invalidateQueries({ queryKey: qk.jobs.mine(userId ?? 'anon') });
      if (requestId) {
        void queryClient.invalidateQueries({ queryKey: qk.requests.detail(requestId) });
      }
    },
  });
}
