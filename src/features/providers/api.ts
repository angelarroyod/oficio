import { supabase } from '@/lib/supabase';
import type {
  FinanceEntry,
  FinanceEntryType,
  Profile,
  ProviderDetails,
  Review,
  TradeType,
} from '@/types/database';

export async function getProviderDetails(userId: string): Promise<ProviderDetails | null> {
  const { data, error } = await supabase
    .from('provider_details')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProviderSetupInput = {
  userId: string;
  trades: TradeType[];
  serviceRadiusKm: number;
  bio?: string;
  baseLat?: number | null;
  baseLng?: number | null;
};

/**
 * Only the columns a provider owns. Metrics, verification and premium flags are
 * rejected by the `provider_details_protected` trigger, so they are not even
 * present in this payload.
 */
export async function updateProviderDetails(input: ProviderSetupInput): Promise<ProviderDetails> {
  const { data, error } = await supabase
    .from('provider_details')
    .update({
      trades: input.trades,
      service_radius_km: input.serviceRadiusKm,
      bio: input.bio?.trim() ? input.bio.trim() : null,
      ...(input.baseLat != null && input.baseLng != null
        ? { base_lat: input.baseLat, base_lng: input.baseLng }
        : null),
    })
    .eq('user_id', input.userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export type ReviewWithAuthor = Review & { client: Pick<Profile, 'full_name'> | null };

export async function listProviderReviews(userId: string): Promise<ReviewWithAuthor[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, client:profiles!reviews_client_id_fkey(full_name)')
    .eq('provider_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as ReviewWithAuthor[];
}

export async function listFinanceEntries(userId: string): Promise<FinanceEntry[]> {
  const { data, error } = await supabase
    .from('provider_finance')
    .select('*')
    .eq('provider_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function createFinanceEntry(input: {
  providerId: string;
  type: FinanceEntryType;
  amount: number;
  category: string;
}): Promise<FinanceEntry> {
  const { data, error } = await supabase
    .from('provider_finance')
    .insert({
      provider_id: input.providerId,
      type: input.type,
      amount: input.amount,
      category: input.category.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'city' | 'colonia'>>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
