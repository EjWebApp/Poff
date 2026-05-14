-- push_tokens: 사용자별 Expo Push Token
create table if not exists public.push_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  updated_at timestamptz default now()
);

alter table public.push_tokens enable row level security;

create policy "Users can manage own push token"
  on public.push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- task_push_notifications: 태스크별 푸시 알림 예약
create table if not exists public.task_push_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id text not null,
  task_index integer not null,
  title text not null,
  body text not null,
  scheduled_at timestamptz not null,
  sent boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_task_push_notif_pending
  on public.task_push_notifications(scheduled_at)
  where sent = false;

alter table public.task_push_notifications enable row level security;

create policy "Users can manage own task push notifications"
  on public.task_push_notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
