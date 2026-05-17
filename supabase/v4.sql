-- ============================================================
-- Trading Journal v4 — Allow multiple trades per day
-- Run in Supabase SQL Editor → New query → Run
-- ============================================================

-- Drop the unique constraint on trades.date (was enforcing 1 trade/day)
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_date_key;

-- Make sure entry_time / exit_time columns exist (added in v2, just in case)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_time text;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_time text;

-- Non-unique index on date (for fast calendar queries)
DROP INDEX IF EXISTS trades_date_idx;
CREATE INDEX IF NOT EXISTS trades_date_idx ON trades(date);