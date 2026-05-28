create table if not exists public.payment_proofs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  gateway_sale_id text,
  plan_id text,
  amount_cents integer,
  proof_url text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists proofs_status_idx on public.payment_proofs(status);
create index if not exists proofs_user_idx on public.payment_proofs(user_id);
alter table public.payment_proofs enable row level security;
drop policy if exists "Users insert own proofs" on public.payment_proofs;
create policy "Users insert own proofs" on public.payment_proofs for insert with check (auth.uid() = user_id);
drop policy if exists "Users read own proofs" on public.payment_proofs;
create policy "Users read own proofs" on public.payment_proofs for select using (auth.uid() = user_id);
drop policy if exists "Service manages proofs" on public.payment_proofs;
create policy "Service manages proofs" on public.payment_proofs for all using (true);
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict (id) do nothing;
drop policy if exists "Users upload own proof files" on storage.objects;
create policy "Users upload own proof files" on storage.objects for insert with check (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "Users read own proof files" on storage.objects;
create policy "Users read own proof files" on storage.objects for select using (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);
