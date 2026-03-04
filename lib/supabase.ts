import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}


export type RoutineSave = {
  id?: string;
  user_id: string;
  input_text: string;
  reflection: string;
  task_memos: Record<number, string>;
  subtitle: string;
  created_at?: string;
  updated_at?: string;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
