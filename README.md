# 루틴 타이머 (React Native / Expo)

TimeMaster 웹 앱의 React Native / Expo 포팅 버전입니다.

## 기능

- **루틴 입력**: `작업명ㅡ시간` 형식 (예: 차준비ㅡ20, MyYieldWeb 작업ㅡ1시간)
- **타이머**: 각 작업별 카운트다운, 진행률 표시
- **알림**: 시작/종료 시 푸시 알림, 햅틱, 토스트
- **저장**: AsyncStorage로 루틴 저장/불러오기

## 실행 방법

```bash
cd mobile
npm install
npx expo start
```

- **Android**: `a` 키 또는 `npx expo start --android`
- **iOS**: `i` 키 (Mac 필요) 또는 Expo Go 앱으로 QR 스캔
- **웹**: `w` 키 또는 `npx expo start --web`

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
