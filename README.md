# Poff (React Native / Expo)

할 일 완료 → "Poff!" 하고 사라짐. 하루 끝 → 오늘이 "Poff!". 스트레스 → Poff!

## 기능

- **루틴 입력**: `작업명ㅡ시간` 형식 (예: 차준비ㅡ20, MyYieldWeb 작업ㅡ1시간)
- **타이머**: 각 작업별 카운트다운, 진행률 표시
- **알림**: 시작/종료 시 푸시 알림, 햅틱, 토스트
- **저장**: AsyncStorage 또는 Supabase (클라우드 동기화)
- **세션 기록**: [시작] 버튼 누를 때마다 일자별로 세션 저장 (하루 여러 번 가능)

## Supabase 설정 (선택)

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/` 폴더의 SQL 순서대로 실행
3. Authentication > Providers에서 **Email** 활성화 (로그인 기능용)
   - Authentication > URL Configuration에서 **Redirect URLs**에 `http://localhost:8081` (웹 개발), 배포 URL, `poff://` (네이티브) 추가
4. **Magic Link**: Authentication > Email Templates 기본값 사용 (링크 클릭으로 로그인)
5. **카카오 로그인** (선택): [Supabase 카카오 가이드](https://supabase.com/docs/guides/auth/social-login/auth-kakao) 참고
   - Kakao Developers Portal에서 앱 생성, REST API key·Client Secret 발급
   - Supabase > Authentication > Providers > Kakao 활성화 후 키 입력
   - Kakao Redirect URI에 `https://<project-ref>.supabase.co/auth/v1/callback` 등록
4. `.env.example`을 `.env`로 복사 후 URL, anon key 입력

## 실행 방법

```bash
cd mobile
npm install
npx expo start
```

- **Android**: `a` 키 또는 `npx expo start --android`
- **iOS**: `i` 키 (Mac 필요) 또는 Expo Go 앱으로 QR 스캔
- **웹**: `w` 키 또는 `npx expo start --web`

## Vercel 웹 배포

1. [Vercel](https://vercel.com) 로그인 후 [maeunjas-projects](https://vercel.com/maeunjas-projects)에서 **Add New** → **Project**
2. GitHub 저장소 연결 또는 `vercel` CLI로 배포:
   ```bash
   npm i -g vercel
   vercel
   ```
3. **Environment Variables**에 추가:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. 빌드 설정은 `vercel.json`에 이미 지정됨 (`buildCommand`, `outputDirectory`)

## 프로젝트 구조

```
Poff/
├── app/
│   ├── _layout.tsx              # 루트 레이아웃, Toast
│   ├── index.tsx                # 메인 화면 (타이머 + 루틴 관리)
│   └── login.tsx                # 로그인 화면 (매직링크 / 카카오)
├── components/
│   ├── TaskInput.tsx            # 루틴 입력, 저장/불러오기/새 루틴 버튼
│   ├── TaskList.tsx             # 작업 목록, 메모, 시간표
│   ├── TimerDisplay.tsx         # 원형 진행 바 + 남은 시간
│   ├── Controls.tsx             # 시작/일시정지/종료/패스 버튼
│   ├── PermissionStatus.tsx     # 알림 권한 상태 표시
│   ├── RoutineListModal.tsx     # 저장된 루틴 목록 바텀시트
│   └── types.ts
├── lib/
│   ├── supabase.ts              # Supabase 클라이언트
│   ├── AuthContext.tsx          # 인증 Context (OTP / 카카오)
│   └── routineStorage.ts       # 루틴 저장/불러오기 (Supabase + 로컬 fallback)
└── supabase/
    ├── migrations/              # DB 스키마 (순서대로 실행)
    └── functions/
        └── send-routine-emails/ # 루틴 완료 이메일 Edge Function
```

## 웹 앱과의 차이

| 웹 | React Native |
|---|---|
| localStorage | AsyncStorage |
| Web Notifications | expo-notifications |
| Sonner (toast) | react-native-toast-message |
| navigator.vibrate | expo-haptics |
| motion (Framer) | react-native-reanimated |
| Tailwind CSS | StyleSheet |


---

## 상태별 버튼 동작 명세 (UI Interaction Spec)

### 루틴 입력 버튼 (저장 / 불러오기 / 새 루틴)

| 앱 상태 | 저장 | 불러오기 | 새 루틴 |
|--------|------|---------|--------|
| 대기중 | ✅ 활성 | ✅ 활성 | ✅ 활성 |
| 실행 중 | ✅ 활성 | ❌ 비활성 | ❌ 비활성 |
| 일시정지 중 | ✅ 활성 | ❌ 비활성 | ❌ 비활성 |

**결정 이유**
- 실행/일시정지 중 불러오기·새루틴을 막는 이유: 진행 중 실수로 루틴을 교체하는 사고 방지
- 바꾸고 싶으면 종료 버튼 → 대기중 상태에서 변경 (명시적 액션 필요)
- 저장은 실행 중에도 허용: 진행 중 내용/메모 수정 후 저장하는 케이스 지원

### 루틴 이름 / 내용 입력 비활성화

| 앱 상태 | 루틴 이름 입력 | 내용 입력 |
|--------|------------|--------|
| 대기중 | ✅ 활성 | ✅ 활성 |
| 실행 중 | ✅ 활성 | ✅ 활성 |
| 일시정지 중 | ✅ 활성 | ✅ 활성 |

---

## 작업 로그

### 2026-03-03
- 인터넷 연결 시 Supabase 저장, 비연결 시 AsyncStorage 로컬 저장 구조 확정
- 미해결: 할일 제목에 `-` 포함 시 파싱 오류, 첫 실행 기본값 문구, 메모 단축키(폰 사이드 버튼)

### 2026-03-06
- [v] 시작 후 추가한 일정의 실제 시간 표시 수정
- [v] 이메일 매직링크 로그인 구현
- 진행 중: 카카오 로그인 (미완)
- 미해결: 앱 닫았다 열어도 실행 중 상태 유지, 앱 종료 후에도 알림 수신

### 2026-05-01 — 루틴 관리 시스템 전면 재설계

#### 설계 변경 사항

기존 **날짜 단위** 저장에서 **루틴 단위** 저장으로 전환.
루틴은 날짜와 무관하게 독립적으로 존재하며, 이름으로 구분한다.

|             | 이전 (날짜 단위)          | 이후 (루틴 단위)                         |
|-------------|-------------------------|----------------------------------------|
| 저장 기준    | 날짜 (하루 1개, 덮어쓰기)  | 루틴 ID (개수 제한 없음)                  |
| 저장 버튼    | 오늘 날짜 저장본 갱신      | 현재 루틴 저장 (신규 생성 or 기존 업데이트)  |
| 시작 버튼     | 세션 히스토리 insert     | 자동 저장 + 실행 세션 기록                 |
| 불러오기 버튼 | 오늘 날짜 저장본 로드      | 저장된 루틴 목록에서 선택                  |
| 앱 열 때     | 오늘 날짜 저장본 로드      | 실행 중 세션 복원 → 마지막 루틴 로드        |

**루틴 이름 규칙**
- 사용자가 직접 입력 가능 (루틴 내용 입력창 위 이름 필드)
- 비워두면 저장/시작 시 `YYYY-MM-DD HH:mm` 형식으로 자동 생성 (예: `2026-05-02 14:30`)

#### 추가된 DB 테이블 (`supabase/migrations/20250501000000_routines_and_sessions.sql`)

- **`routines`** — 사용자별 저장된 루틴 목록 (이름, 내용, 최근 사용일)
- **`active_sessions`** — 현재 실행 중인 세션 상태 (사용자당 1행, upsert)
  - 저장 필드: 루틴 이름(`routine_name`), 루틴 스냅샷, 작업 스케줄(절대 시각), 현재 작업 인덱스, 일시정지 상태
- **`scheduled_notifications`** — 루틴 완료 이메일 예약 테이블

#### 변경된 파일

- **`lib/routineStorage.ts`** — 전면 재작성
  - `saveRoutine(data, routineId?, name?)` — 루틴 생성/업데이트, 루틴 ID 반환
  - `loadRoutines()` — 전체 루틴 목록 (최근 사용 순)
  - `saveActiveSession(session)` / `loadActiveSession()` / `clearActiveSession()` — 세션 복원용
  - `scheduleCompletionEmail(email, routineName, completionTime)` — 이메일 예약
  - Supabase 실패 시 AsyncStorage 로컬 fallback 유지

- **`app/index.tsx`** — 주요 로직 업데이트
  - `currentRoutineId` 상태로 어떤 루틴을 편집 중인지 추적
  - `handleStart`: 자동 저장 → 세션 저장 → 이메일 예약 → 타이머 시작
  - `handleStop`: `clearActiveSession()` 호출로 세션 초기화
  - `finishTask`: 작업 전환 시 세션 상태 업데이트, 완료 시 세션 삭제
  - `handlePause` / `handleResume`: 일시정지 상태 세션에 저장
  - `loadInitialData`: 실행 중 세션 복원 → 마지막 루틴 → 샘플 텍스트 순서로 초기화
  - `restoreSession`: 저장된 스케줄 기반으로 현재 작업 위치 계산 후 타이머 복원

- **`components/RoutineListModal.tsx`** — 신규
  - 저장된 루틴 목록 바텀시트 (최근 사용 순)
  - "새 루틴 만들기" 버튼 포함

- **`components/TaskInput.tsx`** — 업데이트
  - "새 루틴" 버튼 추가
  - 루틴 이름 편집 가능한 TextInput 추가 (`routineName` / `onRoutineNameChange` prop)
  - 이름 비워두면 저장/시작 시 `YYYY-MM-DD HH:mm` 자동 생성

- **`supabase/functions/send-routine-emails/index.ts`** — 신규
  - `scheduled_notifications` 테이블에서 발송 예약된 이메일 처리
  - Resend API 사용 (무료 3000건/월)

#### 이메일 알림 설정 방법 (수동 작업 필요)

1. [Resend](https://resend.com) 가입 후 API 키 발급
2. Supabase 대시보드 > Edge Functions > Secrets에 `RESEND_API_KEY` 추가
3. `supabase/functions/send-routine-emails/index.ts`의 `from` 주소를 인증된 도메인으로 변경
4. Edge Function 배포 후 아래 SQL을 Supabase SQL Editor에서 실행 (5분마다 자동 호출):

```sql
select cron.schedule(
  'send-routine-emails',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://<your-project-ref>.supabase.co/functions/v1/send-routine-emails',
      headers := '{"Authorization": "Bearer <your-service-role-key>"}'::jsonb
    )
  $$
);
```

#### Supabase 카카오 로그인 설정 참고

Supabase Dashboard → Authentication → Providers → Kakao 활성화 후:
- Kakao Client ID (REST API key), Kakao Client Secret 입력
- Redirect URLs에 `http://localhost:8081`, 배포 URL, `poff://` 추가
- Kakao Redirect URI에 `https://vskuvblqkgajciinltal.supabase.co/auth/v1/callback` 등록
- Product Settings → Kakao Login ON, Consent Items: profile_nickname, account_email 활성화

#### 그럼 앱을 종료하고 다시 시작하면 어떻게 되는거지??
restoreSession 함수가 절대 시각(epoch ms) 기반으로 계산해요. 흐름을 보면:

시나리오 1: 루틴 진행 중 앱 종료 → 5분 후 재진입


저장된 스케줄:
  작업A: 14:00 ~ 14:20 (20분)
  작업B: 14:20 ~ 14:50 (30분)  ← 현재 여기
  작업C: 14:50 ~ 15:10 (20분)

재진입 시각: 14:35
  → "지금(14:35)이 어느 작업 범위 안에 있나?" 계산
  → 작업B (14:20~14:50) 안에 있음
  → 작업B의 남은 15분부터 타이머 재개
시나리오 2: 루틴이 끝났어야 할 시간에 재진입


모든 작업 종료 시각 < 지금
  → clearActiveSession() 호출
  → 이메일은 이미 pg_cron이 발송
  → 마지막 루틴 내용만 화면에 표시 (대기중 상태)
시나리오 3: 일시정지 중 앱 종료 → 재진입


isPaused = true → 시간 계산 없이
  → 일시정지 당시 currentTaskIndex로 복원
  → 남은 시간도 일시정지 시점 기준으로 그대로 표시
<< 핵심: 타이머가 "실시간으로 어딘가에서 계속 돌고 있는" 게 아니라, 시작 시각을 저장해뒀다가 재진입 시 "지금이 몇 분째인지" 역산하는 방식이에요.>>