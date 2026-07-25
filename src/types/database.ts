/**
 * Database types — source of truth for all Supabase queries.
 *
 * PLACEHOLDER: hand-written to match supabase/migrations. Replace with
 * generated output once migrations are applied:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * Only the tables Sprint 1 touches (profiles, provider_details) are typed in
 * full; the rest arrive with codegen in Sprint 2.
 */

export type UserRole = 'client' | 'provider';
export type VerificationLevel = 'basic' | 'verified' | 'premium';

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
  trades: string[];
  service_radius_km: number;
  bio: string | null;
  rfc: string | null;
  rfc_status: string;
  verification_level: VerificationLevel;
  punctuality_score: number | null;
  completion_rate: number | null;
  avg_response_minutes: number | null;
  dispute_rate: number | null;
  is_premium: boolean;
  premium_until: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, 'id' | 'role' | 'full_name'> &
          Partial<Omit<ProfileRow, 'id' | 'role' | 'full_name'>>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      provider_details: {
        Row: ProviderDetailsRow;
        Insert: Pick<ProviderDetailsRow, 'user_id'> & Partial<ProviderDetailsRow>;
        Update: Partial<ProviderDetailsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      verification_level: VerificationLevel;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = ProfileRow;
export type ProviderDetails = ProviderDetailsRow;
