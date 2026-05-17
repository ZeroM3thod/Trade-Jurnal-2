-- ============================================================
-- Trading Journal — Supabase Schema
-- Run this entire file in the Supabase SQL Editor once.
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- TABLE: trades
-- One row per calendar day that has been logged.
create table if not exists trades (
  id          bigserial primary key,
  date        date        not null unique,   -- e.g. 2025-05-12
  traded      boolean     not null,          -- true = traded, false = rest day
  pnl         text        check (pnl in ('profit','loss')),  -- null when traded=false
  amount      numeric(12,2) default 0,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- TABLE: transactions
-- Deposits and withdrawals, multiple allowed per day.
create table if not exists transactions (
  id          bigserial primary key,
  date        date        not null,          -- e.g. 2025-05-12
  type        text        not null check (type in ('deposit','withdraw')),
  amount      numeric(12,2) not null,
  time        text,                          -- optional HH:MM string
  note        text,
  created_at  timestamptz not null default now()
);

-- Indexes for fast calendar fetches
create index if not exists trades_date_idx        on trades (date);
create index if not exists transactions_date_idx  on transactions (date);

-- Auto-update updated_at on trades
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trades_updated_at on trades;
create trigger trades_updated_at
  before update on trades
  for each row execute procedure update_updated_at();

-- ============================================================
-- Optional: seed with sample data (comment out if not needed)
-- ============================================================
/*
insert into transactions (date, type, amount, time, note) values
  (current_date - 11, 'deposit',  5000, '09:30', 'Initial capital'),
  (current_date - 6,  'deposit',  1000, '11:00', 'Top up');

insert into trades (date, traded, pnl, amount, note) values
  (current_date - 9,  true,  'profit', 150,  'BTC long'),
  (current_date - 7,  true,  'loss',    60,  'Stop hit'),
  (current_date - 5,  true,  'profit', 320,  'EUR/USD breakout'),
  (current_date - 3,  false, null,       0,   null),
  (current_date - 2,  true,  'loss',    95,  'News spike'),
  (current_date,      true,  'profit', 210,  'Gold long');
*/