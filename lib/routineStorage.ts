import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, isSupabaseConfigured } from './supabase';

const LOCAL_ROUTINES_KEY = 'poff_routines_v2';
const LOCAL_ACTIVE_SESSION_KEY = 'poff_active_session_v1';
const LAST_ROUTINE_ID_KEY = 'poff_last_routine_id_v1';

export type RoutineData = {
  inputText: string;
  reflection: string;
  taskMemos: Record<number, string>;
  subtitle: string;
};

export type Routine = {
  id: string;
  name: string;
  inputText: string;
  reflection: string;
  taskMemos: Record<number, string>;
  subtitle: string;
  lastUsedAt: string;
  createdAt: string;
};

export type ActiveSessionData = {
  routineId: string | null;
  routineName: string;
  inputText: string;
  reflection: string;
  taskMemos: Record<number, string>;
  subtitle: string;
  startedAt: string;
  originalSchedule: { startTime: number; endTime: number }[];
  taskSchedule: { startTime: number; endTime: number }[];
  passedTasks: Record<number, number>;
  currentTaskIndex: number;
  isPaused: boolean;
  pausedAt: number | null;
  pausedAccumMs: number;
  status: 'running' | 'completed' | 'stopped';
};

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseTaskMemos(raw: unknown): Record<number, string> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, string>)) {
    const n = parseInt(k, 10);
    if (!isNaN(n)) result[n] = String(v);
  }
  return result;
}

function parsePassedTasks(raw: unknown): Record<number, number> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<number, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, number>)) {
    const n = parseInt(k, 10);
    if (!isNaN(n)) result[n] = Number(v);
  }
  return result;
}

// ===================== ROUTINES =====================

/** 루틴 저장 (routineId 있으면 업데이트, 없으면 새로 생성) */
export async function saveRoutine(
  data: RoutineData,
  routineId?: string | null,
  name?: string
): Promise<{ ok: boolean; routineId: string }> {
  const routineName = name ?? (data.subtitle?.trim() || '새 루틴');
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const now = new Date().toISOString();

        if (routineId && !routineId.startsWith('local-')) {
          const { error } = await supabase
            .from('routines')
            .update({
              name: routineName,
              input_text: data.inputText,
              reflection: data.reflection,
              task_memos: data.taskMemos,
              subtitle: data.subtitle,
              last_used_at: now,
            })
            .eq('id', routineId)
            .eq('user_id', user.id);

          if (!error) {
            await AsyncStorage.setItem(LAST_ROUTINE_ID_KEY, routineId);
            return { ok: true, routineId };
          }
        }

        const { data: inserted, error: insertError } = await supabase
          .from('routines')
          .insert({
            user_id: user.id,
            name: routineName,
            input_text: data.inputText,
            reflection: data.reflection,
            task_memos: data.taskMemos,
            subtitle: data.subtitle,
            last_used_at: now,
          })
          .select('id')
          .single();

        if (!insertError && inserted) {
          await AsyncStorage.setItem(LAST_ROUTINE_ID_KEY, inserted.id);
          return { ok: true, routineId: inserted.id };
        }
        console.warn('[routineStorage] Supabase insert failed:', insertError?.message);
      }
    } catch (e) {
      console.warn('[routineStorage] saveRoutine Supabase error:', e);
    }
  }

  // 로컬 fallback
  const id = (routineId && routineId.startsWith('local-')) ? routineId : generateLocalId();
  const existing = await _loadLocalRoutines();
  const now = new Date().toISOString();
  const idx = existing.findIndex(r => r.id === id);

  const routine: Routine = {
    id,
    name: routineName,
    inputText: data.inputText,
    reflection: data.reflection,
    taskMemos: data.taskMemos,
    subtitle: data.subtitle,
    lastUsedAt: now,
    createdAt: idx >= 0 ? existing[idx].createdAt : now,
  };

  if (idx >= 0) {
    existing[idx] = routine;
  } else {
    existing.unshift(routine);
  }

  await AsyncStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(existing));
  await AsyncStorage.setItem(LAST_ROUTINE_ID_KEY, id);
  return { ok: true, routineId: id };
}

/** 저장된 루틴 목록 불러오기 (최근 사용 순) */
export async function loadRoutines(): Promise<Routine[]> {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('routines')
          .select('id, name, input_text, reflection, task_memos, subtitle, last_used_at, created_at')
          .eq('user_id', user.id)
          .order('last_used_at', { ascending: false });

        if (!error && data) {
          return data.map(r => ({
            id: r.id,
            name: r.name,
            inputText: r.input_text,
            reflection: r.reflection ?? '',
            taskMemos: parseTaskMemos(r.task_memos),
            subtitle: r.subtitle ?? '',
            lastUsedAt: r.last_used_at,
            createdAt: r.created_at,
          }));
        }
      }
    } catch (e) {
      console.warn('[routineStorage] loadRoutines Supabase error:', e);
    }
  }

  return _loadLocalRoutines();
}

/** 마지막 사용 루틴 ID */
export async function getLastUsedRoutineId(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_ROUTINE_ID_KEY);
}

/** 루틴 삭제 */
export async function deleteRoutine(routineId: string): Promise<{ ok: boolean }> {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured() && !routineId.startsWith('local-')) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('routines')
          .delete()
          .eq('id', routineId)
          .eq('user_id', user.id);
        if (!error) return { ok: true };
        console.warn('[routineStorage] deleteRoutine error:', error.message);
      }
    } catch (e) {
      console.warn('[routineStorage] deleteRoutine Supabase error:', e);
    }
  }

  // 로컬 fallback
  const existing = await _loadLocalRoutines();
  const filtered = existing.filter(r => r.id !== routineId);
  await AsyncStorage.setItem(LOCAL_ROUTINES_KEY, JSON.stringify(filtered));
  return { ok: true };
}

async function _loadLocalRoutines(): Promise<Routine[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ROUTINES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Routine[];
  } catch {
    return [];
  }
}

// ===================== ACTIVE SESSION =====================

/** 실행 중인 세션 저장 (Supabase upsert + 로컬 백업) */
export async function saveActiveSession(session: ActiveSessionData): Promise<{ ok: boolean }> {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('active_sessions').upsert(
          {
            user_id: user.id,
            routine_id: session.routineId && !session.routineId.startsWith('local-')
              ? session.routineId
              : null,
            routine_name: session.routineName,
            input_text: session.inputText,
            reflection: session.reflection,
            task_memos: session.taskMemos,
            subtitle: session.subtitle,
            started_at: session.startedAt,
            original_schedule: session.originalSchedule,
            task_schedule: session.taskSchedule,
            passed_tasks: session.passedTasks,
            current_task_index: session.currentTaskIndex,
            is_paused: session.isPaused,
            paused_at: session.pausedAt ? new Date(session.pausedAt).toISOString() : null,
            paused_accum_ms: session.pausedAccumMs,
            status: session.status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        if (error) console.warn('[routineStorage] saveActiveSession error:', error.message);
      }
    } catch (e) {
      console.warn('[routineStorage] saveActiveSession Supabase error:', e);
    }
  }

  await AsyncStorage.setItem(LOCAL_ACTIVE_SESSION_KEY, JSON.stringify(session));
  return { ok: true };
}

/** 실행 중인 세션 불러오기 (앱 재진입 복원용) */
export async function loadActiveSession(): Promise<ActiveSessionData | null> {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'running')
          .maybeSingle();

        if (!error && data) {
          const taskSched = (data.task_schedule as { startTime: number; endTime: number }[]) ?? [];
          return {
            routineId: data.routine_id ?? null,
            routineName: data.routine_name ?? '',
            inputText: data.input_text,
            reflection: data.reflection ?? '',
            taskMemos: parseTaskMemos(data.task_memos),
            subtitle: data.subtitle ?? '',
            startedAt: data.started_at,
            originalSchedule: (data.original_schedule as { startTime: number; endTime: number }[])?.length
              ? (data.original_schedule as { startTime: number; endTime: number }[])
              : taskSched,
            taskSchedule: taskSched,
            passedTasks: parsePassedTasks(data.passed_tasks),
            currentTaskIndex: data.current_task_index,
            isPaused: data.is_paused ?? false,
            pausedAt: data.paused_at ? new Date(data.paused_at).getTime() : null,
            pausedAccumMs: Number(data.paused_accum_ms ?? 0),
            status: data.status as ActiveSessionData['status'],
          };
        }
      }
    } catch (e) {
      console.warn('[routineStorage] loadActiveSession Supabase error:', e);
    }
  }

  try {
    const raw = await AsyncStorage.getItem(LOCAL_ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveSessionData;
    // 구버전 로컬 데이터 호환
    if (!session.routineName) session.routineName = '';
    if (!session.originalSchedule?.length) session.originalSchedule = session.taskSchedule;
    return session.status === 'running' ? session : null;
  } catch {
    return null;
  }
}

/** 세션 종료 (완료 또는 중단) */
export async function clearActiveSession(): Promise<void> {
  const supabase = getSupabase();

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('active_sessions')
          .update({ status: 'stopped', updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('[routineStorage] clearActiveSession error:', e);
    }
  }

  await AsyncStorage.removeItem(LOCAL_ACTIVE_SESSION_KEY);
}

// ===================== EMAIL SCHEDULING =====================

/** 루틴 완료 이메일 예약 (루틴 시작 시 호출) */
export async function scheduleCompletionEmail(
  email: string,
  routineName: string,
  completionTime: Date
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 이전 미발송 알림 삭제 후 새로 등록
    await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('sent', false);

    await supabase.from('scheduled_notifications').insert({
      user_id: user.id,
      email,
      routine_name: routineName,
      scheduled_at: completionTime.toISOString(),
    });
  } catch (e) {
    console.warn('[routineStorage] scheduleCompletionEmail error:', e);
  }
}

// ===================== PUSH NOTIFICATIONS =====================

/** Expo Push Token 저장 */
export async function savePushToken(token: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('push_tokens').upsert(
      { user_id: user.id, token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.warn('[routineStorage] savePushToken error:', e);
  }
}

export type TaskPushNotif = {
  taskIndex: number;
  title: string;
  body: string;
  scheduledAt: Date;
};

/** 세션의 전체 태스크 푸시 알림 예약 */
export async function saveTaskPushNotifications(
  sessionId: string,
  notifications: TaskPushNotif[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = notifications.map(n => ({
      user_id: user.id,
      session_id: sessionId,
      task_index: n.taskIndex,
      title: n.title,
      body: n.body,
      scheduled_at: n.scheduledAt.toISOString(),
    }));
    await supabase.from('task_push_notifications').insert(rows);
  } catch (e) {
    console.warn('[routineStorage] saveTaskPushNotifications error:', e);
  }
}

/** 앱이 포그라운드에서 태스크를 처리했을 때 백엔드 알림 발송 취소 */
export async function markTaskPushNotificationSent(
  sessionId: string,
  taskIndex: number
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    await supabase
      .from('task_push_notifications')
      .update({ sent: true })
      .eq('session_id', sessionId)
      .eq('task_index', taskIndex);
  } catch (e) {
    console.warn('[routineStorage] markTaskPushNotificationSent error:', e);
  }
}

/** 세션의 미발송 푸시 알림 전체 취소 (루틴 중단 시) */
export async function cancelTaskPushNotifications(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    await supabase
      .from('task_push_notifications')
      .delete()
      .eq('session_id', sessionId)
      .eq('sent', false);
  } catch (e) {
    console.warn('[routineStorage] cancelTaskPushNotifications error:', e);
  }
}

/** 패스 등으로 스케줄이 바뀐 경우 미발송 알림 재등록 */
export async function updateTaskPushNotifications(
  sessionId: string,
  notifications: TaskPushNotif[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // 미발송분만 삭제 후 재등록
    await supabase
      .from('task_push_notifications')
      .delete()
      .eq('session_id', sessionId)
      .eq('sent', false);
    if (notifications.length > 0) {
      const rows = notifications.map(n => ({
        user_id: user.id,
        session_id: sessionId,
        task_index: n.taskIndex,
        title: n.title,
        body: n.body,
        scheduled_at: n.scheduledAt.toISOString(),
      }));
      await supabase.from('task_push_notifications').insert(rows);
    }
  } catch (e) {
    console.warn('[routineStorage] updateTaskPushNotifications error:', e);
  }
}
