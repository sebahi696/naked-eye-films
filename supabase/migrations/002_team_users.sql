-- Team users with username/password (replaces Supabase Auth for pilot)
create table if not exists team_users (
  id uuid primary key default uuid_generate_v4(),
  username text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null default 'editor' check (role in ('owner','editor','admin')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table team_users enable row level security;
-- Service role bypasses RLS; no client policies needed

-- Bootstrap admin (password: admin — change in Admin panel after first login)
insert into team_users (username, password_hash, full_name, role, is_admin)
values (
  'admin',
  '$2b$10$OTVSfifD/LJ/LGxeAn2tku6hWMBSyrkJ4bSd2V4ZeeR4ZbjrABD8u',
  'Admin',
  'owner',
  true
) on conflict (username) do nothing;
