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
3. Authentication > Providers에서 **Anonymous** 활성화
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
mobile/
├── app/
│   ├── _layout.tsx    # 루트 레이아웃, Toast
│   └── index.tsx      # 메인 화면 (타이머 로직)
├── components/
│   ├── TaskInput.tsx
│   ├── TaskList.tsx
│   ├── TimerDisplay.tsx
│   ├── Controls.tsx
│   ├── PermissionStatus.tsx
│   └── types.ts
└── assets/
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


cd D:\dev\EjWebApp\TimeMaster\mobile; npm install drizzle-orm postgres; npm install -D drizzle-kit

# 2026-03-03
인터넷 연결시-클라우드에저장
인터넷 비연결(에러)시 -로컬에 저장
그리고 언제 동기화??

[] 할일 제목에 - 가 있으면 오류남