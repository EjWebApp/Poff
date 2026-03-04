-- Poff: 루틴 저장 스키마
-- Supabase 대시보드 SQL Editor에서 실행하거나: supabase db push

-- routine_saves: 사용자별 저장 데이터 (1인 1행, upsert)
create table if not exists public.routine_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  input_text text default '',
  reflection text default '',
  task_memos jsonb default '{}',
  subtitle text default '오늘을 가볍게, 나답게 끝내기',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- updated_at 자동 갱신
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_routine_saves_updated
  before update on public.routine_saves
  for each row execute function public.handle_updated_at();

-- RLS: 본인 데이터만 접근
alter table public.routine_saves enable row level security;

create policy "Users can view own saves"
  on public.routine_saves for select
  using (auth.uid() = user_id);

create policy "Users can insert own saves"
  on public.routine_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saves"
  on public.routine_saves for update
  using (auth.uid() = user_id);

create policy "Users can delete own saves"
  on public.routine_saves for delete
  using (auth.uid() = user_id);
