-- ============================================================
-- Trading Journal v2 — Schema Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query → Run)
-- ============================================================

-- ── Accounts table ────────────────────────────────────────────────────────────
create table if not exists accounts (
  id              bigserial primary key,
  name            text not null unique,
  broker          text,
  type            text default 'forex' check (type in ('forex','crypto','stocks','other')),
  currency        text default 'USD',
  initial_balance numeric(14,2) default 0,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists accounts_name_idx on accounts(name);

-- ── Extend trades table ───────────────────────────────────────────────────────
alter table trades add column if not exists account_id     bigint references accounts(id) on delete set null;
alter table trades add column if not exists asset_name     text;
alter table trades add column if not exists lots           numeric(12,4);
alter table trades add column if not exists margin         numeric(14,2);
alter table trades add column if not exists entry_price    numeric(16,5);
alter table trades add column if not exists exit_price     numeric(16,5);
alter table trades add column if not exists direction      text check (direction in ('long','short'));
alter table trades add column if not exists trade_reason   text;
alter table trades add column if not exists screenshot_url text;
alter table trades add column if not exists status         text default 'closed' check (status in ('open','pending','closed'));

create index if not exists trades_account_idx on trades(account_id);
create index if not exists trades_asset_idx   on trades(asset_name);
create index if not exists trades_status_idx  on trades(status);

-- ── Optional: Supabase Storage bucket for screenshots ────────────────────────
-- Run this separately in Storage settings, or via the Supabase dashboard:
-- Create a public bucket called "trade-screenshots"
-- insert into storage.buckets (id, name, public) values ('trade-screenshots','trade-screenshots', true)
-- on conflict do nothing;