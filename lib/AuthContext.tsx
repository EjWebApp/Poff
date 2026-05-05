import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import { getSupabase } from './supabase';

const AUTO_LOGIN_KEY = 'poff_auto_login';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  autoLogin: boolean;
  autoLoginReady: boolean;
  isAuthenticated: boolean;
  setAutoLogin: (value: boolean) => Promise<void>;
  signInWithOtp: (email: string, emailRedirectTo?: string) => Promise<{ error: Error | null }>;
  signInWithKakao: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
  });
  const [autoLogin, setAutoLoginState] = useState(false);
  const [autoLoginReady, setAutoLoginReady] = useState(false);
  const [loggedInThisSession, setLoggedInThisSession] = useState(false);

  const isAuthenticated = !!state.session && (autoLogin || loggedInThisSession);

  useEffect(() => {
    AsyncStorage.getItem(AUTO_LOGIN_KEY).then(val => {
      setAutoLoginState(val === 'true');
      setAutoLoginReady(true);
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session: session ?? null, user: session?.user ?? null, isLoading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session: session ?? null, user: session?.user ?? null, isLoading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const setAutoLogin = async (value: boolean) => {
    setAutoLoginState(value);
    await AsyncStorage.setItem(AUTO_LOGIN_KEY, value ? 'true' : 'false');
  };

  const signInWithOtp = async (email: string, emailRedirectTo?: string) => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase not configured') };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, ...(emailRedirectTo && { emailRedirectTo }) },
    });
    return { error: error ?? null };
  };

  const signInWithKakao = async () => {
    const supabase = getSupabase();
    if (!supabase) return { error: new Error('Supabase not configured') };

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (!error) setLoggedInThisSession(true);
      return { error: error ?? null };
    }

    try {
      const { accessToken } = await kakaoLogin();
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/functions/v1/kakao-native-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ kakao_access_token: accessToken }),
      });

      const json = await res.json();
      if (json.error) return { error: new Error(json.error) };

      const { error } = await supabase.auth.setSession({
        access_token: json.access_token,
        refresh_token: json.refresh_token,
      });
      if (!error) setLoggedInThisSession(true);
      return { error: error ?? null };
    } catch (e: any) {
      return { error: new Error(e?.message ?? '카카오 로그인 실패') };
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setLoggedInThisSession(false);
    await setAutoLogin(false);
  };

  const value: AuthContextValue = {
    ...state,
    autoLogin,
    autoLoginReady,
    isAuthenticated,
    setAutoLogin,
    signInWithOtp,
    signInWithKakao,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
