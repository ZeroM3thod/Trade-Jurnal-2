-- Allow all operations on trades (no auth required)
alter table trades  enable row level security;
alter table transactions enable row level security;

create policy "allow all on trades"
  on trades for all
  using (true)
  with check (true);

create policy "allow all on transactions"
  on transactions for all
  using (true)
  with check (true);