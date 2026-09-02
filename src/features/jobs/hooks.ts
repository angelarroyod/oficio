import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/lib/queryKeys';
import { useSessionStore } from '@/store/session';

import {
  cancelJob,
  completeJob,
  createReview,
  getJob,
  listMyJobs,
  markArrived,
  markEnRoute,
} from './api';

export function useMyJobs() {
  const userId = useSessionStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: qk.jobs.mine(userId ?? 'anon'),
    queryFn: listMyJobs,
    enabled: Boolean(userId),
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: qk.jobs.detail(id ?? 'none'),
    queryFn: () => getJob(id!),
    enabled: Boolean(id),
  });
}

/**
 * One hook for every job transition. They all invalidate the same two keys, so
 * five near-identical hooks would be five places to forget one.
 */
export function useJobAction(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: qk.jobs.mine(userId ?? 'anon') });
    if (jobId) void queryClient.invalidateQueries({ queryKey: qk.jobs.detail(jobId) });
    void queryClient.invalidateQueries({ queryKey: qk.provider.details(userId ?? 'anon') });
  }

  const enRoute = useMutation({ mutationFn: markEnRoute, onSuccess: invalidate });
  const arrived = useMutation({ mutationFn: markArrived, onSuccess: invalidate });
  const complete = useMutation({
    mutationFn: (photoUris: string[]) =>
      completeJob({ id: jobId!, providerId: userId!, photoUris }),
    onSuccess: invalidate,
  });
  const cancel = useMutation({
    mutationFn: (reason: string) => cancelJob(jobId!, reason),
    onSuccess: invalidate,
  });

  return { enRoute, arrived, complete, cancel };
}

export function useCreateReview(jobId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.session?.user.id);

  return useMutation({
    mutationFn: (input: {
      providerId: string;
      rating: number;
      punctualityRating: number;
      comment?: string;
    }) => createReview({ ...input, jobId: jobId!, clientId: userId! }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.jobs.mine(userId ?? 'anon') });
      if (jobId) void queryClient.invalidateQueries({ queryKey: qk.jobs.detail(jobId) });
    },
  });
}
