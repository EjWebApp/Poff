-- routine_sessions: [시작] 버튼 누를 때마다 1행 추가 (일자별 여러 번 가능)
create table if not exists public.routine_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_date date not null,
  started_at timestamptz not null default now(),
  input_text text not null default '',
  reflection text default '',
  task_memos jsonb default '{}',
  subtitle text default '오늘을 가볍게, 나답게 끝내기',
  created_at timestamptz default now()
);

-- 일자별 조회용 인덱스
create index if not exists idx_routine_sessions_user_date
  on public.routine_sessions(user_id, session_date desc);

-- RLS
alter table public.routine_sessions enable row level security;

create policy "Users can view own sessions"
  on public.routine_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.routine_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.routine_sessions for delete
  using (auth.uid() = user_id);
