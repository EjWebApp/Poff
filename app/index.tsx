import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Toast from 'react-native-toast-message';
import { Timer, Info } from 'lucide-react-native';
import { TaskInput } from '../components/TaskInput';
import { TaskList } from '../components/TaskList';
import type { Task } from '../components/types';
import { TimerDisplay } from '../components/TimerDisplay';
import { Controls } from '../components/Controls';
import { PermissionStatus } from '../components/PermissionStatus';

const STORAGE_KEY = 'routine_alarm_v1_text';
const SAMPLE_TEXT = `차준비ㅡ20
국민연금 납부ㅡ10
MyYieldWeb 작업ㅡ1시간
기타연습ㅡ1시간
식사ㅡ1시간`;

type PermissionStatusType =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'
  | 'checking';

// 알림 표시 방식: 앱이 foreground일 때
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('대기중');
  const [isPaused, setIsPaused] = useState(false);
  const [permission, setPermission] = useState<PermissionStatusType>('checking');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const taskStartRef = useRef(0);
  const taskEndRef = useRef(0);
  const totalSecsRef = useRef(0);
  const pausedAccumRef = useRef(0);
  const pauseAtRef = useRef(0);

  // Initialize
  useEffect(() => {
    loadSavedText();
    checkNotificationPermission();
  }, []);

  async function loadSavedText() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      setInputText(saved || SAMPLE_TEXT);
    } catch {
      setInputText(SAMPLE_TEXT);
    }
  }

  // Parse tasks whenever input changes
  useEffect(() => {
    const parsed = parseAll(inputText);
    setTasks(parsed.tasks);
  }, [inputText]);

  // Timer tick effect
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= tasks.length || isPaused) {
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.max(
        0,
        (now - taskStartRef.current - pausedAccumRef.current) / 1000
      );
      const remain = Math.max(0, totalSecsRef.current - elapsed);
      const prog =
        totalSecsRef.current === 0
          ? 0
          : Math.min(1, elapsed / totalSecsRef.current);

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

  async function notify(title: string, body: string) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }

    Toast.show({
      type: 'info',
      text1: title,
      text2: body,
      position: 'top',
    });

    try {
      if (permission === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null, // 즉시 표시
        });
      }
    } catch {
      // Toast로 충분
    }
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
    let h = 0,
      m = 0;

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
      [title, durStr] = line.split('ㅡ').map((s) => s.trim());
    } else if (line.includes('—')) {
      [title, durStr] = line.split('—').map((s) => s.trim());
    } else if (line.includes('-')) {
      [title, durStr] = line.split('-').map((s) => s.trim());
    } else if (line.includes('–')) {
      [title, durStr] = line.split('–').map((s) => s.trim());
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
      .map((l) => l.replace(/\s+/g, ' ').trim())
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

  function startTask(index: number) {
    setCurrentIndex(index);
    setIsPaused(false);
    pauseAtRef.current = 0;
    pausedAccumRef.current = 0;

    const task = tasks[index];
    totalSecsRef.current = task.minutes * 60;
    taskStartRef.current = Date.now();
    taskEndRef.current = taskStartRef.current + totalSecsRef.current * 1000;

    setStatus(
      `진행: ${index + 1}/${tasks.length} · 시작: ${new Date().toLocaleTimeString()}`
    );
    notify('🟦 루틴 시작', `${task.title} (${task.minutes}분) 시작!`);
  }

  function finishTask() {
    if (currentIndex < 0 || currentIndex >= tasks.length) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const task = tasks[currentIndex];
    notify('✅ 루틴 종료', `${task.title} 종료! 다음으로 넘어갈게.`);

    const next = currentIndex + 1;
    if (next < tasks.length) {
      setTimeout(() => startTask(next), 300);
    } else {
      setCurrentIndex(tasks.length);
      setStatus(`완료 🎉 · 종료: ${new Date().toLocaleTimeString()}`);
      setRemainingTime(0);
      setProgress(1);
      notify('🎉 전체 루틴 완료', '오늘 계획 끝! 수고했어.');
    }
  }

  async function handleStart() {
    await requestNotificationPermission();

    const parsed = parseAll(inputText);

    if (parsed.errors.length) {
      Toast.show({
        type: 'error',
        text1: '입력 오류',
        text2: parsed.errors.join('\n'),
      });
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

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    handleStop();
    setTasks(parsed.tasks);
    startTask(0);
  }

  function handleStop() {
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
    setStatus('대기중');
    setRemainingTime(0);
    setProgress(0);
  }

  function handlePause() {
    if (currentIndex < 0 || currentIndex >= tasks.length) return;
    if (isPaused) return;

    setIsPaused(true);
    pauseAtRef.current = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus('일시정지됨');
    notify('⏸ 일시정지', `${tasks[currentIndex].title} 잠깐 멈춤`);
  }

  function handleResume() {
    if (currentIndex < 0 || currentIndex >= tasks.length) return;
    if (!isPaused) return;

    setIsPaused(false);
    const now = Date.now();
    pausedAccumRef.current += now - pauseAtRef.current;
    pauseAtRef.current = 0;

    setStatus('재개됨');
    notify('⏵ 재개', `${tasks[currentIndex].title} 다시 시작`);
  }

  async function handleSave() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, inputText);
      Toast.show({
        type: 'success',
        text1: '💾 저장',
        text2: '입력한 루틴을 저장했어.',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: '저장 실패',
      });
    }
  }

  async function handleLoad() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY) || SAMPLE_TEXT;
      setInputText(saved);
      Toast.show({
        type: 'success',
        text1: '📥 불러오기',
        text2: '저장된 루틴을 불러왔어.',
      });
    } catch {
      setInputText(SAMPLE_TEXT);
    }
  }

  const isRunning = currentIndex >= 0 && currentIndex < tasks.length;

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Timer size={28} color="#a855f7" />
            <Text style={styles.title}>루틴 타이머</Text>
          </View>
          <Text style={styles.subtitle}>
            입력 예시: 차준비ㅡ20 (분), MyYieldWeb 작업ㅡ1시간 (시간){'\n'}
            시작하면 각 항목 시작/종료 때 알림이 뜬다.
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>루틴 입력</Text>
            <PermissionStatus permission={permission} />
          </View>

          <TaskInput
            value={inputText}
            onChange={setInputText}
            onSave={handleSave}
            onLoad={handleLoad}
          />

          <View style={styles.controlsWrap}>
            <Controls
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              isRunning={isRunning}
              isPaused={isPaused}
            />
          </View>

          <View style={styles.tipBox}>
            <View style={styles.tipIcon}>
              <Info size={14} color="rgba(255,255,255,0.5)" />
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
          </View>

          <View style={styles.card}>
            <TaskList tasks={tasks} currentIndex={currentIndex} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
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
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
    color: '#fff',
  },
  controlsWrap: {
    marginTop: 16,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 20,
  },
  tipBold: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  grid: {
    gap: 24,
  },
});
