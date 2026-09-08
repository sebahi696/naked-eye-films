alter table pings add column if not exists reply text;
alter table pings add column if not exists replied_at timestamptz;
alter table pings add column if not exists brand text;
