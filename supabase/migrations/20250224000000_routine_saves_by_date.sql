-- routine_saves: 날짜별 저장 (user_id + save_date 당 1행)
-- 기존 unique(user_id) 제거, (user_id, save_date)로 변경

-- 1. unique 제약 제거
alter table public.routine_saves drop constraint if exists routine_saves_user_id_key;

-- 2. save_date 컬럼 추가
alter table public.routine_saves add column if not exists save_date date default current_date;

-- 3. 기존 데이터에 save_date 채우기 (created_at 기준)
update public.routine_saves set save_date = created_at::date;

-- 4. not null 적용
alter table public.routine_saves alter column save_date set not null;
alter table public.routine_saves alter column save_date set default current_date;

-- 5. 새 unique 제약
alter table public.routine_saves add constraint routine_saves_user_date_unique unique (user_id, save_date);

-- 6. 인덱스 (날짜별 조회)
create index if not exists idx_routine_saves_user_date on public.routine_saves(user_id, save_date desc);
