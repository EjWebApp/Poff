-- routines: 사용자별 저장된 루틴 목록
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default '새 루틴',
  input_text text not null default '',
  reflection text default '',
  task_memos jsonb default '{}',
  subtitle text default '오늘을 가볍게, 나답게 끝내기',
  last_used_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_routines_user_last_used
  on public.routines(user_id, last_used_at desc);

create or replace function public.handle_routines_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_routines_updated
  before update on public.routines
  for each row execute function public.handle_routines_updated_at();

alter table public.routines enable row level security;

create policy "Users can manage own routines"
  on public.routines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- active_sessions: 현재 실행 중인 세션 (사용자당 1행)
create table if not exists public.active_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  routine_name text default '',
  input_text text not null default '',
  reflection text default '',
  task_memos jsonb default '{}',
  subtitle text default '',
  started_at timestamptz not null default now(),
  original_schedule jsonb not null default '[]',
  task_schedule jsonb not null default '[]',
  passed_tasks jsonb not null default '{}',
  current_task_index integer not null default 0,
  is_paused boolean default false,
  paused_at timestamptz,
  paused_accum_ms bigint default 0,
  status text not null default 'running',
  updated_at timestamptz default now()
);

alter table public.active_sessions enable row level security;

create policy "Users can manage own active session"
  on public.active_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- scheduled_notifications: 루틴 완료 이메일 예약
create table if not exists public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  routine_name text not null,
  scheduled_at timestamptz not null,
  sent boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_scheduled_notifications_pending
  on public.scheduled_notifications(scheduled_at)
  where sent = false;

alter table public.scheduled_notifications enable row level security;

create policy "Users can manage own notifications"
  on public.scheduled_notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
