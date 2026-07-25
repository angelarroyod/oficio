-- Extensions and shared enums.
-- cube + earthdistance power the provider-zone radius filter without PostGIS.

create extension if not exists cube;
create extension if not exists earthdistance;

create type user_role as enum ('client', 'provider');
create type verification_level as enum ('basic', 'verified', 'premium');
create type rfc_status as enum ('none', 'submitted', 'validated', 'rejected');

-- Trade identifiers in English (code convention); Spanish labels live client-side.
create type trade_type as enum (
  'plumbing',      -- plomería
  'electrical',    -- electricidad
  'masonry',       -- albañilería
  'carpentry',     -- carpintería
  'cleaning',      -- limpieza
  'installations'  -- instalaciones
);

create type request_urgency as enum ('emergency', 'this_week', 'flexible');
create type request_status as enum ('open', 'quoted', 'accepted', 'cancelled', 'expired');
-- Diagnosis and execution are distinct visits (decision: flag now, chain later).
create type visit_type as enum ('diagnostic', 'full_service');

create type quote_status as enum ('sent', 'accepted', 'rejected', 'expired', 'withdrawn');
create type job_status as enum ('scheduled', 'en_route', 'in_progress', 'completed', 'cancelled');
create type moderation_status as enum ('published', 'under_review', 'removed');
create type finance_entry_type as enum ('income', 'expense');
create type report_target_type as enum ('review', 'profile', 'request', 'quote');
