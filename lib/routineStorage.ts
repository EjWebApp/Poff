import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'routine_alarm_v1_text';
const REFLECTION_KEY = 'routine_reflection_v1';
const TASK_MEMOS_KEY = 'routine_task_memos_v1';
const SUBTITLE_KEY = 'routine_subtitle_v1';

export type RoutineData = {
  inputText: string;
  reflection: string;
  taskMemos: Record<number, string>;
  subtitle: string;
};

/** 오늘 날짜 YYYY-MM-DD */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadRoutineData(targetDate?: string): Promise<RoutineData> {
  const date = targetDate ?? todayStr();
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('routine_saves')
          .select('input_text, reflection, task_memos, subtitle')
          .eq('user_id', user.id)
          .eq('save_date', date)
          .maybeSingle();

        if (!error && data) {
          const raw = (data.task_memos as Record<string, string>) ?? {};
          const taskMemos: Record<number, string> = {};
          for (const [k, v] of Object.entries(raw)) {
            const n = parseInt(k, 10);
            if (!isNaN(n)) taskMemos[n] = v;
          }
          return {
            inputText: data.input_text ?? '',
            reflection: data.reflection ?? '',
            taskMemos,
            subtitle: data.subtitle ?? '오늘을 가볍게, 나답게 끝내기',
          };
        }
      }
    } catch {
      // Fall through to AsyncStorage
    }
  }

  const [saved, reflection, taskMemos, subtitle] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEY),
    AsyncStorage.getItem(REFLECTION_KEY),
    AsyncStorage.getItem(TASK_MEMOS_KEY),
    AsyncStorage.getItem(SUBTITLE_KEY),
  ]);

  let parsedMemos: Record<number, string> = {};
  if (taskMemos) {
    try {
      parsedMemos = JSON.parse(taskMemos);
    } catch {
      // ignore
    }
  }

  return {
    inputText: saved ?? '',
    reflection: reflection ?? '',
    taskMemos: parsedMemos,
    subtitle: subtitle ?? '오늘을 가볍게, 나답게 끝내기',
  };
}

/** [시작] 버튼 누를 때 호출 - 일자별로 여러 세션 저장 */
export async function saveRoutineSession(data: RoutineData): Promise<{ ok: boolean; fromSupabase?: boolean }> {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        user = anonData.user;
      }
      if (user) {
        const now = new Date();
        const sessionDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const { error } = await supabase.from('routine_sessions').insert({
          user_id: user.id,
          session_date: sessionDate,
          started_at: now.toISOString(),
          input_text: data.inputText,
          reflection: data.reflection,
          task_memos: data.taskMemos,
          subtitle: data.subtitle,
        });
        if (!error) {
          return { ok: true, fromSupabase: true };
        }
      }
    } catch {
      // ignore
    }
  }
  return { ok: true };
}

export async function saveRoutineData(data: RoutineData): Promise<{ ok: boolean; fromSupabase?: boolean }> {
  const supabase = getSupabase();
  if (supabase && isSupabaseConfigured()) {
    try {
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          console.warn('[routineStorage] Anonymous sign-in failed:', anonError.message);
          throw anonError;
        }
        user = anonData?.user ?? null;
      }
      if (user) {
        const saveDate = todayStr();
        const { error } = await supabase.from('routine_saves').upsert(
          {
            user_id: user.id,
            save_date: saveDate,
            input_text: data.inputText,
            reflection: data.reflection,
            task_memos: data.taskMemos,
            subtitle: data.subtitle,
          },
          { onConflict: 'user_id,save_date' }
        );
        if (!error) {
          return { ok: true, fromSupabase: true };
        }
        console.warn('[routineStorage] Supabase upsert failed:', error.message, error.code);
      }
    } catch (e) {
      console.warn('[routineStorage] Supabase save failed, falling back to local:', e);
      // Fall through to AsyncStorage
    }
  }

  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, data.inputText),
      AsyncStorage.setItem(REFLECTION_KEY, data.reflection),
      AsyncStorage.setItem(TASK_MEMOS_KEY, JSON.stringify(data.taskMemos)),
      AsyncStorage.setItem(SUBTITLE_KEY, data.subtitle),
    ]);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
