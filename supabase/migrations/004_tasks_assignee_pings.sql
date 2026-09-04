-- Assign tasks to editor or designer; track reel count
alter table jobs add column if not exists assignee_role text not null default 'editor' check (assignee_role in ('editor','designer'));
alter table jobs add column if not exists reels_count integer;

alter table team_users drop constraint if exists team_users_role_check;
alter table team_users add constraint team_users_role_check check (role in ('owner','editor','admin','designer'));

create table if not exists pings (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete set null,
  from_user_id uuid references team_users(id) on delete set null,
  from_name text not null,
  to_role text not null default 'owner',
  kind text not null check (kind in ('question','done','reminder','need_script')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table pings enable row level security;
