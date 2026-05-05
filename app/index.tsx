import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  AppState,
} from 'react-native';
import {
  saveRoutine,
  loadRoutines,
  getLastUsedRoutineId,
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  scheduleCompletionEmail,
  deleteRoutine,
  type Routine,
  type ActiveSessionData,
} from '../lib/routineStorage';
import { useAuth } from '../lib/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { Info, Settings } from 'lucide-react-native';
import { TaskInput } from '../components/TaskInput';
import { TaskList } from '../components/TaskList';
import type { Task } from '../components/types';
import { TimerDisplay } from '../components/TimerDisplay';
import { Controls } from '../components/Controls';
import { PermissionStatus } from '../components/PermissionStatus';
import { RoutineListModal } from '../components/RoutineListModal';

const SAMPLE_TEXT = `클라이언트 미팅 :1시간
개발 작업 :3시간
점심 :1시간
이메일 답장 :30분
운동 :1시간`;

type PermissionStatusType =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'
  | 'checking';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  // 루틴 데이터
  const [inputText, setInputText] = useState('');
  const [reflection, setReflection] = useState('');
  const [taskMemos, setTaskMemos] = useState<Record<number, string>>({});
  const [subtitle, setSubtitle] = useState('시간을 부탁해!');

  // 루틴 관리
  const [currentRoutineId, setCurrentRoutineId] = useState<string | null>(null);
  const [currentRoutineName, setCurrentRoutineName] = useState('');
  const [routineList, setRoutineList] = useState<Routine[]>([]);
  const [showRoutineList, setShowRoutineList] = useState(false);

  // 타이머 상태
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('대기중');
  const [isPaused, setIsPaused] = useState(false);
  const [permission, setPermission] = useState<PermissionStatusType>('checking');
  const [schedule, setSchedule] = useState<{ startTime: number; endTime: number }[] | null>(null);
  const [passedTasks, setPassedTasks] = useState<Record<number, number>>({});

  // 타이머 refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const taskStartRef = useRef(0);
  const taskEndRef = useRef(0);
  const totalSecsRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseAtRef = useRef(0);
  const originalScheduleRef = useRef<{ startTime: number; endTime: number }[] | null>(null);
  const memoDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 세션 기준 데이터 ref (시작 시점에 고정, finishTask 등 async 콜백에서 사용)
  const sessionBaseRef = useRef<Pick<ActiveSessionData,
    'routineId' | 'routineName' | 'inputText' | 'reflection' | 'taskMemos' | 'subtitle' | 'startedAt'
  > | null>(null);

  useEffect(() => {
    if (isLoading) return;
    loadInitialData();
    checkNotificationPermission();
  }, [isLoading]);

  // 항상 최신 세션 상태를 즉시 저장할 수 있는 함수 ref
  const saveNowRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    saveNowRef.current = () => {
      const base = sessionBaseRef.current;
      if (!base || currentIndex < 0) return;
      saveActiveSession({
        ...base,
        taskMemos,
        originalSchedule: originalScheduleRef.current ?? [],
        taskSchedule: schedule ?? originalScheduleRef.current ?? [],
        passedTasks,
        currentTaskIndex: currentIndex,
        isPaused,
        pausedAt: isPaused ? pauseAtRef.current : null,
        pausedAccumMs: pausedAccumRef.current,
        status: 'running',
      }).catch(() => {});
    };
  }, [currentIndex, taskMemos, passedTasks, isPaused, schedule]);

  // debounce: 메모 변경 후 1초 뒤 세션 저장
  useEffect(() => {
    if (currentIndex < 0) return;
    if (memoDebounceRef.current) clearTimeout(memoDebounceRef.current);
    memoDebounceRef.current = setTimeout(() => {
      saveNowRef.current?.();
    }, 1000);
    return () => {
      if (memoDebounceRef.current) clearTimeout(memoDebounceRef.current);
    };
  }, [taskMemos, currentIndex]);

  // 앱 백그라운드/종료 시 즉시 저장
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'background' || next === 'inactive') {
        saveNowRef.current?.();
      }
    });
    return () => sub.remove();
  }, []);

  async function loadInitialData() {
    // 1순위: 실행 중이던 세션 복원
    try {
      const activeSession = await loadActiveSession();
      if (activeSession) {
        const parsed = parseAll(activeSession.inputText);
        if (parsed.tasks.length > 0 && activeSession.taskSchedule.length === parsed.tasks.length) {
          setInputText(activeSession.inputText);
          setReflection(activeSession.reflection);
          setTaskMemos(activeSession.taskMemos);
          setSubtitle(activeSession.subtitle);
          restoreSession(activeSession, parsed.tasks);
          return;
        }
      }
    } catch (e) {
      console.warn('[HomeScreen] 세션 복원 실패:', e);
    }

    // 2순위: 마지막 사용 루틴
    try {
      const lastId = await getLastUsedRoutineId();
      if (lastId) {
        const routines = await loadRoutines();
        const last = routines.find(r => r.id === lastId);
        if (last) {
          applyRoutine(last);
          return;
        }
      }
    } catch (e) {
      console.warn('[HomeScreen] 마지막 루틴 로드 실패:', e);
    }

    setInputText(SAMPLE_TEXT);
  }

  function applyRoutine(routine: Routine) {
    setInputText(routine.inputText);
    setReflection(routine.reflection);
    setTaskMemos(routine.taskMemos);
    setSubtitle(routine.subtitle);
    setCurrentRoutineId(routine.id);
    setCurrentRoutineName(routine.name);  // 저장된 이름 그대로 표시
  }

  function restoreSession(session: ActiveSessionData, parsedTasks: Task[]) {
    // taskSchedule = 패스 반영된 실제 시각 (타이머 ref 및 표시에 사용)
    // originalSchedule = 세션 시작 시 고정, finishTask의 computeAdjustedSchedule 기준
    const taskSchedule = session.taskSchedule;
    const originalSchedule = session.originalSchedule;
    const now = Date.now();

    // Bug 2 fix: 탐색을 currentTaskIndex부터 시작 → 패스된 작업의 이전 endTime에 걸리지 않음
    let taskIndex = parsedTasks.length;
    if (session.isPaused) {
      taskIndex = session.currentTaskIndex;
    } else {
      for (let i = session.currentTaskIndex; i < taskSchedule.length; i++) {
        if (now < taskSchedule[i].endTime + session.pausedAccumMs) {
          taskIndex = i;
          break;
        }
      }
    }

    if (taskIndex >= parsedTasks.length) {
      clearActiveSession();
      return;
    }

    // Bug 3 fix: taskSchedule(조정된 실제 시각)로 타이머 refs 설정
    originalScheduleRef.current = originalSchedule;
    taskStartRef.current = taskSchedule[taskIndex].startTime;
    taskEndRef.current = taskSchedule[taskIndex].endTime;
    totalSecsRef.current = parsedTasks[taskIndex].minutes * 60;
    pausedAccumRef.current = session.pausedAccumMs;

    if (session.isPaused && session.pausedAt) {
      pauseAtRef.current = session.pausedAt;
      const elapsed = Math.max(
        0,
        (session.pausedAt - taskStartRef.current - session.pausedAccumMs) / 1000
      );
      setRemainingTime(Math.max(0, totalSecsRef.current - elapsed));
      setProgress(Math.min(1, elapsed / totalSecsRef.current));
    }

    // Bug 1 fix: routineName 포함
    sessionBaseRef.current = {
      routineId: session.routineId,
      routineName: session.routineName,
      inputText: session.inputText,
      reflection: session.reflection,
      taskMemos: session.taskMemos,
      subtitle: session.subtitle,
      startedAt: session.startedAt,
    };

    setTasks(parsedTasks);
    setPassedTasks(session.passedTasks);
    setSchedule(taskSchedule);  // Bug 2 fix: 이미 조정된 스케줄 그대로 사용
    setCurrentIndex(taskIndex);
    setIsPaused(session.isPaused);
    setCurrentRoutineId(session.routineId);
    setCurrentRoutineName(session.routineName || '');
    setStatus(`재개: ${taskIndex + 1}/${parsedTasks.length}`);
  }

  // inputText 변경 시 tasks 동기화
  useEffect(() => {
    const parsed = parseAll(inputText);
    setTasks(parsed.tasks);
  }, [inputText]);

  // 실행 중 tasks 개수 변경 시 schedule 재계산
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= tasks.length) return;
    const base = originalScheduleRef.current;
    if (!base || base.length === 0) return;
    if (schedule && tasks.length === schedule.length) return;

    const sessionStart = base[0].startTime;
    const newBase = computeSchedule(tasks, sessionStart);
    originalScheduleRef.current = newBase;
    const newAdjusted = computeAdjustedSchedule(newBase, passedTasks, tasks);
    setSchedule(newAdjusted);
  }, [tasks, schedule, currentIndex, passedTasks]);

  // 타이머 tick
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= tasks.length || isPaused) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.max(
        0,
        (now - taskStartRef.current - pausedAccumRef.current) / 1000
      );
      const remain = Math.max(0, totalSecsRef.current - elapsed);
      const prog =
        totalSecsRef.current === 0 ? 0 : Math.min(1, elapsed / totalSecsRef.current);

      setRemainingTime(remain);
      setProgress(prog);

      const endIn = taskEndRef.current + pausedAccumRef.current - now;
      if (endIn <= 20) {
        finishTask();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [currentIndex, tasks.length, isPaused]);

  async function checkNotificationPermission() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermission(
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default'
      );
    } catch {
      setPermission('unsupported');
    }
  }

  async function requestNotificationPermission() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermission(
        status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'default'
      );
      return status;
    } catch {
      setPermission('unsupported');
      return 'undetermined';
    }
  }

  async function notify(title: string, body: string, options?: { visibilityTime?: number }) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }

    Toast.show({
      type: 'info',
      text1: title,
      text2: body,
      position: 'top',
      visibilityTime: options?.visibilityTime ?? 4000,
    });

    try {
      if (permission === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null,
        });
      }
    } catch { }
  }

  function generateRoutineName(): string {
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${mo}-${d} ${h}:${min}`;
  }

  function formatTime(seconds: number): string {
    const secs = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function parseDurationToMinutes(s: string): number {
    if (!s) return NaN;
    s = s.replace(/\s+/g, '').trim();
    let h = 0, m = 0;

    const hm = s.match(/(\d+)\s*시간(?:(\d+)\s*분)?/);
    if (hm) {
      h = Number(hm[1] || 0);
      m = Number(hm[2] || 0);
      return h * 60 + m;
    }
    const mm = s.match(/(\d+)\s*분/);
    if (mm) return Number(mm[1]);
    const n = s.match(/^\d+$/);
    if (n) return Number(s);
    const h2 = s.match(/(\d+)\s*h/i);
    const m2 = s.match(/(\d+)\s*m/i);
    if (h2 || m2) {
      h = h2 ? Number(h2[1]) : 0;
      m = m2 ? Number(m2[1]) : 0;
      return h * 60 + m;
    }
    return NaN;
  }

  function parseLine(line: string): Task | null {
    line = line.replace(/\s+/g, ' ').trim();
    if (!line) return null;
    line = line.replace(/^\s*\d+\s*[\.\)\-]\s*/, '');

    let title: string, durStr: string;
    if (line.includes('ㅡ')) {
      [title, durStr] = line.split('ㅡ').map(s => s.trim());
    } else if (line.includes('—')) {
      [title, durStr] = line.split('—').map(s => s.trim());
    } else if (line.includes('–')) {
      [title, durStr] = line.split('–').map(s => s.trim());
    } else if (line.includes(':')) {
      const idx = line.lastIndexOf(':');
      title = line.slice(0, idx).trim();
      durStr = line.slice(idx + 1).trim();
    } else if (line.includes('-')) {
      [title, durStr] = line.split('-').map(s => s.trim());
    } else {
      title = line.trim();
      durStr = '';
    }

    title = (title || '').trim();
    durStr = (durStr || '').trim();
    if (!title) return null;

    const minutes = parseDurationToMinutes(durStr);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { title, minutes: 0, raw: line };
    }
    return { title, minutes, raw: line };
  }

  function parseAll(text: string): { tasks: Task[]; errors: string[] } {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const tasks: Task[] = [];
    const errors: string[] = [];

    for (const line of lines) {
      const task = parseLine(line);
      if (!task) continue;
      if (task.minutes <= 0) {
        errors.push(`"${task.raw}" → 시간 인식 실패`);
      } else {
        tasks.push(task);
      }
    }
    return { tasks, errors };
  }

  function computeSchedule(
    tasksList: Task[],
    baseStart: number
  ): { startTime: number; endTime: number }[] {
    const result: { startTime: number; endTime: number }[] = [];
    let cursor = baseStart;
    for (const t of tasksList) {
      const start = cursor;
      const end = cursor + t.minutes * 60 * 1000;
      result.push({ startTime: start, endTime: end });
      cursor = end;
    }
    return result;
  }

  function computeAdjustedSchedule(
    baseSchedule: { startTime: number; endTime: number }[],
    passed: Record<number, number>,
    tasksList: Task[]
  ): { startTime: number; endTime: number }[] {
    return baseSchedule.map((slot, i) => {
      const totalSaved = Object.entries(passed).reduce(
        (sum, [k, v]) => sum + (Number(k) < i ? v : 0),
        0
      );
      const shiftMs = totalSaved * 60 * 1000;
      const start = slot.startTime - shiftMs;
      const end = start + (tasksList[i]?.minutes ?? 0) * 60 * 1000;
      return { startTime: start, endTime: end };
    });
  }

  function startTask(index: number, overrideNow?: number) {
    setCurrentIndex(index);
    setIsPaused(false);
    pauseAtRef.current = 0;
    pausedAccumRef.current = 0;

    const task = tasks[index];
    totalSecsRef.current = task.minutes * 60;
    const now = overrideNow ?? Date.now();
    taskStartRef.current = now;
    taskEndRef.current = now + totalSecsRef.current * 1000;

    if (index === 0 && overrideNow === undefined) {
      const base = computeSchedule(tasks, now);
      originalScheduleRef.current = base;
      setSchedule(base);
    }

    setStatus(`진행: ${index + 1}/${tasks.length} · 시작: ${new Date().toLocaleTimeString()}`);
    notify('🟦 루틴 시작', `${task.title} (${task.minutes}분) 시작!`);
  }

  function finishTask(isPass = false) {
    if (currentIndex < 0 || currentIndex >= tasks.length) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const task = tasks[currentIndex];
    const next = currentIndex + 1;
    let newPassed = passedTasks;
    let adjustedSchedule = schedule;

    if (isPass) {
      const m = task.minutes;
      const saved =
        m >= 60
          ? m % 60 === 0
            ? `${Math.floor(m / 60)}시간`
            : `${Math.floor(m / 60)}시간 ${m % 60}분`
          : `${m}분`;
      newPassed = { ...passedTasks, [currentIndex]: m };
      setPassedTasks(newPassed);
      const base = originalScheduleRef.current;
      if (base) {
        let adj = computeAdjustedSchedule(base, newPassed, tasks);
        if (next < tasks.length) {
          const nextStartAt = Date.now() + 300;
          adj = [...adj];
          adj[next] = {
            startTime: nextStartAt,
            endTime: nextStartAt + tasks[next].minutes * 60 * 1000,
          };
          for (let i = next + 1; i < adj.length; i++) {
            const start = adj[i - 1].endTime;
            adj[i] = { startTime: start, endTime: start + tasks[i].minutes * 60 * 1000 };
          }
        }
        adjustedSchedule = adj;
        setSchedule(adj);
      }
      notify('⏭ 패스', `${task.title} 건너뛰기 · ${saved} 절약`, { visibilityTime: 7000 });
    } else {
      notify('✅ 루틴 종료', `${task.title} 종료! 다음으로 넘어갈게.`);
    }

    if (next < tasks.length) {
      // 세션 상태 업데이트 (비차단)
      const base = sessionBaseRef.current;
      if (base) {
        saveActiveSession({
          ...base,
          taskMemos,
          originalSchedule: originalScheduleRef.current ?? [],
          taskSchedule: adjustedSchedule ?? originalScheduleRef.current ?? [],
          passedTasks: newPassed,
          currentTaskIndex: next,
          isPaused: false,
          pausedAt: null,
          pausedAccumMs: pausedAccumRef.current,
          status: 'running',
        }).catch(() => { });
      }
      setTimeout(() => startTask(next), 300);
    } else {
      setCurrentIndex(tasks.length);
      setStatus(`완료 🎉 · 종료: ${new Date().toLocaleTimeString()}`);
      setRemainingTime(0);
      setProgress(1);
      notify('🎉 전체 루틴 완료', '오늘 계획 끝! 수고했어.');
      clearActiveSession().catch(() => { });
    }
  }

  async function handleStart() {
    await requestNotificationPermission();

    const parsed = parseAll(inputText);

    if (parsed.errors.length) {
      Toast.show({ type: 'error', text1: '입력 오류', text2: parsed.errors.join('\n') });
      return;
    }
    if (parsed.tasks.length === 0) {
      Toast.show({
        type: 'error',
        text1: '루틴이 비어있어',
        text2: '예: 차준비ㅡ20 / MyYieldWeb 작업ㅡ1시간',
      });
      return;
    }

    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { }

    // 1. 루틴 자동 저장 (기존 루틴이면 업데이트, 새 루틴이면 생성)
    const nameToUse = currentRoutineName.trim() || generateRoutineName();
    if (!currentRoutineName.trim()) setCurrentRoutineName(nameToUse);
    const saveResult = await saveRoutine(
      { inputText, reflection, taskMemos, subtitle },
      currentRoutineId,
      nameToUse
    );
    const newRoutineId = saveResult.routineId;
    setCurrentRoutineId(newRoutineId);

    // 2. 시작 전 타이머 초기화
    handleStop(true); // skipClearSession=true: 새 세션 저장 전이므로 아직 지우지 않음

    // 3. 초기 스케줄 계산
    const sessionStart = Date.now();
    const initialSchedule = computeSchedule(parsed.tasks, sessionStart);
    originalScheduleRef.current = initialSchedule;
    setSchedule(initialSchedule);

    // 4. 세션 기준 데이터 저장
    const sessionBase = {
      routineId: newRoutineId,
      routineName: nameToUse,
      inputText,
      reflection,
      taskMemos,
      subtitle,
      startedAt: new Date(sessionStart).toISOString(),
    };
    sessionBaseRef.current = sessionBase;

    // 5. 실행 세션 저장 (백그라운드 복원용)
    const totalMs = parsed.tasks.reduce((sum, t) => sum + t.minutes * 60 * 1000, 0);
    await saveActiveSession({
      ...sessionBase,
      originalSchedule: initialSchedule,
      taskSchedule: initialSchedule,
      passedTasks: {},
      currentTaskIndex: 0,
      isPaused: false,
      pausedAt: null,
      pausedAccumMs: 0,
      status: 'running',
    });

    // 6. 이메일 알림 예약
    if (user?.email) {
      await scheduleCompletionEmail(
        user.email,
        subtitle?.trim() || '루틴',
        new Date(sessionStart + totalMs)
      );
    }

    // 7. 루틴 시작
    setTasks(parsed.tasks);
    startTask(0, sessionStart);
  }

  function handleStop(skipClearSession = false) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentIndex >= 0 && currentIndex < tasks.length) {
      notify('■ 루틴 중단', `중단됨: ${tasks[currentIndex].title}`);
    }

    setCurrentIndex(-1);
    setIsPaused(false);
    pauseAtRef.current = 0;
    pausedAccumRef.current = 0;
    originalScheduleRef.current = null;
    setSchedule(null);
    setPassedTasks({});
    setStatus('대기중');
    setRemainingTime(0);
    setProgress(0);

    if (!skipClearSession) {
      clearActiveSession().catch(() => { });
    }
  }

  function handlePause() {
    if (currentIndex < 0 || currentIndex >= tasks.length || isPaused) return;

    setIsPaused(true);
    pauseAtRef.current = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus('일시정지됨');
    notify('⏸ 일시정지', `${tasks[currentIndex].title} 잠깐 멈춤`);

    const base = sessionBaseRef.current;
    if (base) {
      saveActiveSession({
        ...base,
        taskMemos,
        originalSchedule: originalScheduleRef.current ?? [],
        taskSchedule: schedule ?? originalScheduleRef.current ?? [],
        passedTasks,
        currentTaskIndex: currentIndex,
        isPaused: true,
        pausedAt: pauseAtRef.current,
        pausedAccumMs: pausedAccumRef.current,
        status: 'running',
      }).catch(() => { });
    }
  }

  function handleResume() {
    if (currentIndex < 0 || currentIndex >= tasks.length || !isPaused) return;

    setIsPaused(false);
    const now = Date.now();
    pausedAccumRef.current += now - pauseAtRef.current;
    pauseAtRef.current = 0;

    setStatus('재개됨');
    notify('⏵ 재개', `${tasks[currentIndex].title} 다시 시작`);

    const base = sessionBaseRef.current;
    if (base) {
      saveActiveSession({
        ...base,
        taskMemos,
        originalSchedule: originalScheduleRef.current ?? [],
        taskSchedule: schedule ?? originalScheduleRef.current ?? [],
        passedTasks,
        currentTaskIndex: currentIndex,
        isPaused: false,
        pausedAt: null,
        pausedAccumMs: pausedAccumRef.current,
        status: 'running',
      }).catch(() => { });
    }
  }

  async function handleSave() {
    try {
      const nameToUse = currentRoutineName.trim() || generateRoutineName();
      if (!currentRoutineName.trim()) setCurrentRoutineName(nameToUse);
      const result = await saveRoutine(
        { inputText, reflection, taskMemos, subtitle },
        currentRoutineId,
        nameToUse
      );
      if (result.ok) {
        setCurrentRoutineId(result.routineId);
        Toast.show({
          type: 'success',
          text1: '💾 저장',
          text2: `"${nameToUse}" 저장했어.`,
        });
      }
    } catch {
      Toast.show({ type: 'error', text1: '저장 실패' });
    }
  }

  async function handleOpenRoutineList() {
    try {
      const list = await loadRoutines();
      setRoutineList(list);
    } catch {
      setRoutineList([]);
    }
    setShowRoutineList(true);
  }

  function handleSelectRoutine(routine: Routine) {
    applyRoutine(routine);
    Toast.show({
      type: 'success',
      text1: '📥 불러오기',
      text2: `"${routine.name}" 루틴을 불러왔어.`,
    });
  }

  async function handleDeleteRoutine(routineId: string) {
    await deleteRoutine(routineId);
    setRoutineList(prev => prev.filter(r => r.id !== routineId));
    if (currentRoutineId === routineId) {
      setCurrentRoutineId(null);
    }
  }

  function handleNewRoutine() {
    setInputText('');
    setReflection('');
    setTaskMemos({});
    setSubtitle('');
    setCurrentRoutineId(null);
    setCurrentRoutineName('');  // 비워두면 저장 시 자동 생성
  }

  const isRunning = currentIndex >= 0 && currentIndex < tasks.length;

  if (isSupabaseConfigured()) {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Blob 배경 */}
        <View style={styles.blob1} pointerEvents="none" />
        <View style={styles.blob2} pointerEvents="none" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Image source={require('../assets/main_char.png')} style={styles.headerIcon} resizeMode="contain" />
              <Text style={styles.title}>Poff</Text>
            </View>
            {isSupabaseConfigured() && (
              <TouchableOpacity
                style={styles.authBtn}
                onPress={() => router.push('/settings')}
              >
                <Settings size={22} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.subtitleInput}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="오늘을 가볍게, 나답게 끝내기"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>오늘의 계획</Text>
            <PermissionStatus permission={permission} />
          </View>

          <TaskInput
            value={inputText}
            onChange={setInputText}
            onSave={handleSave}
            onLoad={handleOpenRoutineList}
            onNew={handleNewRoutine}
            routineName={currentRoutineName}
            onRoutineNameChange={setCurrentRoutineName}
            isRunning={isRunning}
          />

          <View style={styles.controlsWrap}>
            <Controls
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={() => handleStop(false)}
              onPass={() => finishTask(true)}
              isRunning={isRunning}
              isPaused={isPaused}
            />
          </View>

          <View style={styles.tipBox}>
            <View style={styles.tipIcon}>
              <Info size={14} color="#9ca3af" />
            </View>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>모바일 팁:</Text> (1) 알림 허용, (2)
              화면 꺼짐 상태에선 제한될 수 있음, (3) 앱을 최소화하지 말고 켜두기
            </Text>
          </View>
        </View>

        {/* Timer & Task List */}
        <View style={styles.grid}>
          <View style={styles.card}>
            {currentIndex >= tasks.length && tasks.length > 0 ? (
              <View style={styles.completedWrap}>
                <Image
                  source={require('../assets/poff.gif')}
                  style={styles.completedCharacter}
                  resizeMode="contain"
                />
                <Text style={styles.completedText}>오늘 루틴 완료! 수고했어요 🎉</Text>
              </View>
            ) : (
              <TimerDisplay
                currentTask={
                  currentIndex >= 0 && currentIndex < tasks.length
                    ? tasks[currentIndex].title
                    : '-'
                }
                remainingTime={formatTime(remainingTime)}
                progress={progress}
                status={status}
              />
            )}
          </View>

          <View style={styles.card}>
            <TaskList
              tasks={tasks}
              currentIndex={currentIndex}
              progress={progress}
              schedule={schedule}
              passedTasks={passedTasks}
              taskMemos={taskMemos}
              onTaskMemoChange={(index, text) =>
                setTaskMemos(prev => ({ ...prev, [index]: text }))
              }
            />
          </View>
        </View>
      </ScrollView>

      <RoutineListModal
        visible={showRoutineList}
        routines={routineList}
        onSelect={handleSelectRoutine}
        onDelete={handleDeleteRoutine}
        onNew={handleNewRoutine}
        onClose={() => setShowRoutineList(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob1: {
    position: 'absolute',
    top: 60,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(125,211,192,0.18)',
    zIndex: 0,
  },
  blob2: {
    position: 'absolute',
    top: 400,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,139,123,0.15)',
    zIndex: 0,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 1152,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 70,
    height: 70,
    transform: [{ scaleX: -1 }],
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  authBtnText: {
    fontSize: 13,
    color: '#6b7280',
  },
  title: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: 20,
    color: '#333333',
  },
  subtitleInput: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  controlsWrap: {
    marginTop: 16,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 16,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 20,
  },
  tipBold: {
    color: '#374151',
    fontWeight: '600',
  },
  grid: {
    gap: 24,
  },
  completedWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  completedCharacter: {
    width: 140,
    height: 140,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    textAlign: 'center',
  },
});
