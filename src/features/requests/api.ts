import { supabase } from '@/lib/supabase';
import { BUCKETS, uploadPhotos } from '@/lib/storage';
import type {
  Quote,
  RequestUrgency,
  ServiceRequest,
  TradeType,
  VisitType,
} from '@/types/database';

/**
 * A request plus the quotes the caller is allowed to see. The nested select is
 * the same string for both roles because RLS decides what comes back: the
 * request owner receives every quote on it, a provider receives only their own.
 */
export type RequestWithQuotes = ServiceRequest & { quotes: Quote[] };

const SELECT_WITH_QUOTES = '*, quotes(*)';

export async function listMyRequests(clientId: string): Promise<RequestWithQuotes[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(SELECT_WITH_QUOTES)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RequestWithQuotes[];
}

export async function getRequest(id: string): Promise<RequestWithQuotes | null> {
  const { data, error } = await supabase
    .from('requests')
    .select(SELECT_WITH_QUOTES)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as RequestWithQuotes | null) ?? null;
}

/**
 * Provider opportunity feed. No filters are applied here on purpose — the
 * `requests_select_provider_feed` policy already restricts rows to the
 * provider's trades and service radius, so anything that arrives is eligible.
 */
export async function listOpportunities(): Promise<RequestWithQuotes[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(SELECT_WITH_QUOTES)
    .in('status', ['open', 'quoted'])
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as RequestWithQuotes[];
}

export type CreateRequestInput = {
  clientId: string;
  trade: TradeType;
  visitType: VisitType;
  title: string;
  description: string;
  addressText: string;
  lat: number;
  lng: number;
  urgency: RequestUrgency;
  /** Local picker URIs; uploaded here so an abandoned form leaves no files. */
  photoUris: string[];
};

export async function createRequest(input: CreateRequestInput): Promise<ServiceRequest> {
  const photos = await uploadPhotos(BUCKETS.requestPhotos, input.clientId, input.photoUris);

  const { data, error } = await supabase
    .from('requests')
    .insert({
      client_id: input.clientId,
      trade: input.trade,
      visit_type: input.visitType,
      title: input.title,
      description: input.description,
      address_text: input.addressText,
      lat: input.lat,
      lng: input.lng,
      urgency: input.urgency,
      photos,
      status: 'open',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelRequest(id: string): Promise<void> {
  const { error } = await supabase.from('requests').update({ status: 'cancelled' }).eq('id', id);
  if (error) throw error;
}
