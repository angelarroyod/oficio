import { quoteTotals } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Job, Quote, QuoteLineItem, ServiceRequest } from '@/types/database';

// Re-exported so quote screens import totals from the feature they belong to.
export { quoteTotals };

export type QuoteWithRequest = Quote & { requests: ServiceRequest | null };

/**
 * Lazy expiry. The DB has no scheduler on the free tier, so quotes past
 * `valid_until` are swept whenever someone is about to look at a list of them.
 * Idempotent and cheap; failure is non-fatal (the accept path re-checks).
 */
export async function expireStaleQuotes(): Promise<void> {
  const { error } = await supabase.rpc('expire_stale_quotes');
  if (error) throw error;
}

export async function listMyQuotes(providerId: string): Promise<QuoteWithRequest[]> {
  await expireStaleQuotes().catch(() => undefined);

  const { data, error } = await supabase
    .from('quotes')
    .select('*, requests(*)')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuoteWithRequest[];
}

export type CreateQuoteInput = {
  requestId: string;
  providerId: string;
  lineItems: QuoteLineItem[];
  estimatedDurationMinutes: number;
  notes?: string;
  /** Days the quote stays acceptable. */
  validityDays: number;
};

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const totals = quoteTotals(input.lineItems);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + input.validityDays);

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      request_id: input.requestId,
      provider_id: input.providerId,
      line_items: input.lineItems,
      subtotal: totals.subtotal,
      iva: totals.iva,
      total: totals.total,
      estimated_duration_minutes: input.estimatedDurationMinutes,
      notes: input.notes?.trim() ? input.notes.trim() : null,
      valid_until: validUntil.toISOString(),
      status: 'sent',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function withdrawQuote(id: string): Promise<void> {
  const { error } = await supabase.from('quotes').update({ status: 'withdrawn' }).eq('id', id);
  if (error) throw error;
}

/**
 * The one write that matters. Rejecting siblings, closing the request and
 * creating the job happen inside `accept_quote()`; the client never gets to
 * do half of it.
 */
export async function acceptQuote(
  quoteId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<Job> {
  const { data, error } = await supabase.rpc('accept_quote', {
    p_quote_id: quoteId,
    p_window_start: windowStart.toISOString(),
    p_window_end: windowEnd.toISOString(),
  });
  if (error) throw error;
  return data as Job;
}
