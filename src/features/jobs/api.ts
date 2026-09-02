import { supabase } from '@/lib/supabase';
import { BUCKETS, uploadPhotos } from '@/lib/storage';
import type { Job, Profile, Quote, Review, ServiceRequest } from '@/types/database';

export type JobDetail = Job & {
  quotes: (Quote & { requests: ServiceRequest | null }) | null;
  reviews: Review[];
  client: Profile | null;
  provider: Profile | null;
};

/**
 * Both parties see the same shape. The two profile embeds are disambiguated by
 * foreign-key name because `jobs` points at `profiles` twice — PostgREST cannot
 * guess which one `profiles(*)` means.
 */
const SELECT_DETAIL =
  '*, quotes(*, requests(*)), reviews(*), client:profiles!jobs_client_id_fkey(*), provider:profiles!jobs_provider_id_fkey(*)';

export async function listMyJobs(): Promise<JobDetail[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(SELECT_DETAIL)
    .order('window_start', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as JobDetail[];
}

export async function getJob(id: string): Promise<JobDetail | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(SELECT_DETAIL)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as JobDetail | null) ?? null;
}

export async function markEnRoute(id: string): Promise<void> {
  const { error } = await supabase.from('jobs').update({ status: 'en_route' }).eq('id', id);
  if (error) throw error;
}

export async function markArrived(id: string): Promise<void> {
  // actual_arrival_at is stamped by the transition trigger, not by the client —
  // a provider must not be able to backdate their own punctuality.
  const { error } = await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', id);
  if (error) throw error;
}

export async function completeJob(input: {
  id: string;
  providerId: string;
  photoUris: string[];
}): Promise<void> {
  const photos = await uploadPhotos(BUCKETS.jobPhotos, input.providerId, input.photoUris);
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'completed', completion_photos: photos })
    .eq('id', input.id);
  if (error) throw error;
}

export async function cancelJob(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'cancelled', cancellation_reason: reason })
    .eq('id', id);
  if (error) throw error;
}

export async function createReview(input: {
  jobId: string;
  clientId: string;
  providerId: string;
  rating: number;
  punctualityRating: number;
  comment?: string;
}): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      job_id: input.jobId,
      client_id: input.clientId,
      provider_id: input.providerId,
      rating: input.rating,
      punctuality_rating: input.punctualityRating,
      comment: input.comment?.trim() ? input.comment.trim() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
