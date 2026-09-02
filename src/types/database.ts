/**
 * Database types — source of truth for all Supabase queries.
 *
 * Hand-written to match supabase/migrations. Replace with generated output
 * once the toolchain is wired up:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * Until then, the shapes here and the SQL in supabase/migrations must move
 * together; the SQL is the authority when they disagree.
 */

export type UserRole = 'client' | 'provider';
export type VerificationLevel = 'basic' | 'verified' | 'premium';
export type RfcStatus = 'none' | 'submitted' | 'validated' | 'rejected';

export type TradeType =
  | 'plumbing'
  | 'electrical'
  | 'masonry'
  | 'carpentry'
  | 'cleaning'
  | 'installations';

export type RequestUrgency = 'emergency' | 'this_week' | 'flexible';
export type RequestStatus = 'open' | 'quoted' | 'accepted' | 'cancelled' | 'expired';
export type VisitType = 'diagnostic' | 'full_service';
export type QuoteStatus = 'sent' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
export type JobStatus = 'scheduled' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
export type ModerationStatus = 'published' | 'under_review' | 'removed';
export type FinanceEntryType = 'income' | 'expense';
export type ReportTargetType = 'review' | 'profile' | 'request' | 'quote';

/** A quote line item as stored in quotes.line_items (pesos, not centavos). */
export type QuoteLineItem = {
  concept: string;
  qty: number;
  unit_price: number;
  type: 'labor' | 'material';
};

type ProfileRow = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  colonia: string | null;
  created_at: string;
  deleted_at: string | null;
};

type ProviderDetailsRow = {
  user_id: string;
  trades: TradeType[];
  service_radius_km: number;
  bio: string | null;
  rfc: string | null;
  rfc_status: RfcStatus;
  verification_level: VerificationLevel;
  punctuality_score: number | null;
  completion_rate: number | null;
  avg_response_minutes: number | null;
  dispute_rate: number | null;
  is_premium: boolean;
  premium_until: string | null;
  base_lat: number | null;
  base_lng: number | null;
};

type RequestRow = {
  id: string;
  client_id: string;
  trade: TradeType;
  visit_type: VisitType;
  title: string;
  description: string;
  photos: string[];
  address_text: string;
  lat: number;
  lng: number;
  urgency: RequestUrgency;
  status: RequestStatus;
  created_at: string;
};

type QuoteRow = {
  id: string;
  request_id: string;
  provider_id: string;
  line_items: QuoteLineItem[];
  subtotal: number;
  iva: number;
  total: number;
  estimated_duration_minutes: number;
  notes: string | null;
  valid_until: string;
  status: QuoteStatus;
  created_at: string;
  responded_at: string | null;
};

type JobRow = {
  id: string;
  quote_id: string;
  client_id: string;
  provider_id: string;
  window_start: string;
  window_end: string;
  status: JobStatus;
  actual_arrival_at: string | null;
  completed_at: string | null;
  completion_photos: string[];
  cancellation_reason: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  job_id: string;
  client_id: string;
  provider_id: string;
  rating: number;
  punctuality_rating: number;
  comment: string | null;
  is_flagged: boolean;
  moderation_status: ModerationStatus;
  created_at: string;
};

type ProviderFinanceRow = {
  id: string;
  provider_id: string;
  type: FinanceEntryType;
  amount: number;
  category: string;
  receipt_url: string | null;
  job_id: string | null;
  occurred_at: string;
  created_at: string;
};

type BlockedUserRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  created_at: string;
};

/** Insert = required columns plus everything else optional (DB fills defaults). */
type Insertable<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, 'id' | 'role' | 'full_name'>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      provider_details: {
        Row: ProviderDetailsRow;
        Insert: Insertable<ProviderDetailsRow, 'user_id'>;
        Update: Partial<ProviderDetailsRow>;
        Relationships: [
          {
            foreignKeyName: 'provider_details_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      requests: {
        Row: RequestRow;
        Insert: Insertable<
          RequestRow,
          'client_id' | 'trade' | 'title' | 'description' | 'address_text' | 'lat' | 'lng'
        >;
        Update: Partial<RequestRow>;
        Relationships: [
          {
            foreignKeyName: 'requests_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      quotes: {
        Row: QuoteRow;
        Insert: Insertable<
          QuoteRow,
          | 'request_id'
          | 'provider_id'
          | 'line_items'
          | 'subtotal'
          | 'iva'
          | 'total'
          | 'estimated_duration_minutes'
          | 'valid_until'
        >;
        Update: Partial<QuoteRow>;
        Relationships: [
          {
            foreignKeyName: 'quotes_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'requests';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'quotes_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      jobs: {
        // No Insert type on purpose: jobs are created only by accept_quote().
        Row: JobRow;
        Insert: never;
        Update: Partial<JobRow>;
        Relationships: [
          {
            foreignKeyName: 'jobs_quote_id_fkey';
            columns: ['quote_id'];
            isOneToOne: true;
            referencedRelation: 'quotes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'jobs_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: ReviewRow;
        Insert: Insertable<
          ReviewRow,
          'job_id' | 'client_id' | 'provider_id' | 'rating' | 'punctuality_rating'
        >;
        Update: Partial<ReviewRow>;
        Relationships: [
          {
            foreignKeyName: 'reviews_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: true;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_finance: {
        Row: ProviderFinanceRow;
        Insert: Insertable<ProviderFinanceRow, 'provider_id' | 'type' | 'amount' | 'category'>;
        Update: Partial<ProviderFinanceRow>;
        Relationships: [
          {
            foreignKeyName: 'provider_finance_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_finance_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      blocked_users: {
        Row: BlockedUserRow;
        Insert: Insertable<BlockedUserRow, 'blocker_id' | 'blocked_id'>;
        Update: Partial<BlockedUserRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Insertable<ReportRow, 'reporter_id' | 'target_type' | 'target_id' | 'reason'>;
        Update: Partial<ReportRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_quote: {
        Args: { p_quote_id: string; p_window_start: string; p_window_end: string };
        Returns: JobRow;
      };
      expire_stale_quotes: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      verification_level: VerificationLevel;
      rfc_status: RfcStatus;
      trade_type: TradeType;
      request_urgency: RequestUrgency;
      request_status: RequestStatus;
      visit_type: VisitType;
      quote_status: QuoteStatus;
      job_status: JobStatus;
      moderation_status: ModerationStatus;
      finance_entry_type: FinanceEntryType;
      report_target_type: ReportTargetType;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = ProfileRow;
export type ProviderDetails = ProviderDetailsRow;
export type ServiceRequest = RequestRow;
export type Quote = QuoteRow;
export type Job = JobRow;
export type Review = ReviewRow;
export type FinanceEntry = ProviderFinanceRow;
