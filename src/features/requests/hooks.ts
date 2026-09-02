import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';
import { useSessionStore } from '@/store/session';

import {
  cancelRequest,
  createRequest,
  getRequest,
  listMyRequests,
  listOpportunities,
  type CreateRequestInput,
} from './api';

export function useMyRequests() {
  const userId = useSessionStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: qk.requests.mine(userId ?? 'anon'),
    queryFn: () => listMyRequests(userId!),
    enabled: Boolean(userId),
  });
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: qk.requests.detail(id ?? 'none'),
    queryFn: () => getRequest(id!),
    enabled: Boolean(id),
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: qk.requests.opportunities(),
    queryFn: listOpportunities,
    // A feed goes stale the moment another provider quotes; refetch on focus.
    staleTime: 30_000,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: Omit<CreateRequestInput, 'clientId'>) =>
      createRequest({ ...input, clientId: userId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.requests.mine(userId ?? 'anon') });
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (id: string) => cancelRequest(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: qk.requests.mine(userId ?? 'anon') });
      void queryClient.invalidateQueries({ queryKey: qk.requests.detail(id) });
    },
  });
}
