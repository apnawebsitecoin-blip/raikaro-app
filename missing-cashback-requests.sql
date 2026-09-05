-- Run this in Supabase SQL editor to create the missing_cashback_requests table

create table if not exists missing_cashback_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  order_url       text not null,
  platform        text not null,
  order_amount    numeric not null,
  order_date      date not null,
  screenshot_url  text,
  status          text not null default 'pending'
                    check (status in ('pending', 'resolved', 'rejected')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table missing_cashback_requests enable row level security;

create policy "Users can insert own requests"
  on missing_cashback_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can view own requests"
  on missing_cashback_requests for select
  using (auth.uid() = user_id);

create index on missing_cashback_requests(user_id, created_at desc);
