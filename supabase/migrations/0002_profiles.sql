-- User profiles: one row per auth user, role fixed at creation.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text,
  avatar_url text,
  city text,
  colonia text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table profiles is 'App profile per auth user. deleted_at marks account deletion (anonymized, App Store 5.1.1(v)).';

create index profiles_role_idx on profiles (role) where deleted_at is null;
