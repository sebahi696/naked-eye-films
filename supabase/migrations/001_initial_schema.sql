-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (linked to Supabase Auth users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'editor' check (role in ('owner','editor','admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can read all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- ============================================================
-- JOBS
-- ============================================================
create type job_stage as enum (
  'new_order','shoot_booked','shot','sd_received',
  'on_drive','waiting_script','editing','review','sent'
);

create table jobs (
  id uuid primary key default uuid_generate_v4(),
  client_name text not null,
  job_type text not null default 'video' check (job_type in ('photoshoot','video','mixed')),
  deliverable text not null,
  shoot_date date,
  script_notes text,
  script_provided boolean not null default false,
  route text not null default 'hussein' check (route in ('hussein','agency')),
  agency_name text,
  due_date date,
  stage job_stage not null default 'new_order',
  studio_folder text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table jobs enable row level security;
create policy "Authenticated users can read jobs" on jobs for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert jobs" on jobs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update jobs" on jobs for update using (auth.role() = 'authenticated');

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger jobs_updated_at before update on jobs
  for each row execute function update_updated_at();

-- ============================================================
-- JOB EVENTS (audit log)
-- ============================================================
create table job_events (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references jobs(id) on delete cascade,
  actor_role text not null,
  actor_name text not null,
  stage_from job_stage,
  stage_to job_stage not null,
  note text,
  created_at timestamptz not null default now()
);

alter table job_events enable row level security;
create policy "Authenticated can read events" on job_events for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert events" on job_events for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- LEADS
-- ============================================================
create table leads (
  id uuid primary key default uuid_generate_v4(),
  contact_name text not null,
  company text,
  source text,
  status text not null default 'new' check (status in ('new','contacted','proposal','won','lost')),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now()
);

alter table leads enable row level security;
create policy "Authenticated can read leads" on leads for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert leads" on leads for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update leads" on leads for update using (auth.role() = 'authenticated');

-- ============================================================
-- MEETINGS
-- ============================================================
create table meetings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  client_or_lead text,
  date date not null,
  time text not null,
  type text not null default 'meeting' check (type in ('shoot','meeting')),
  location text,
  notes text,
  created_at timestamptz not null default now()
);

alter table meetings enable row level security;
create policy "Authenticated can read meetings" on meetings for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert meetings" on meetings for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update meetings" on meetings for update using (auth.role() = 'authenticated');

-- ============================================================
-- WHATSAPP REMINDERS LOG
-- ============================================================
create table whatsapp_reminders (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  type text not null,
  sent_at timestamptz not null default now(),
  wa_number text not null,
  message_body text not null
);

alter table whatsapp_reminders enable row level security;
create policy "Authenticated can read reminders" on whatsapp_reminders for select using (auth.role() = 'authenticated');
create policy "Service role can insert reminders" on whatsapp_reminders for insert with check (true);
