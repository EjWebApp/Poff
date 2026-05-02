import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSupabase } from './supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
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

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        session: session ?? null,
        user: session?.user ?? null,
        isLoading: false,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          session: session ?? null,
          user: session?.user ?? null,
          isLoading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOtp = async (email: string, emailRedirectTo?: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[Auth] signInWithOtp: Supabase not configured');
      return { error: new Error('Supabase not configured') };
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        ...(emailRedirectTo && { emailRedirectTo }),
      },
    });
    return { error: error ?? null };
  };

  const signInWithKakao = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[Auth] signInWithKakao: Supabase not configured');
      return { error: new Error('Supabase not configured') };
    }
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'poff://';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo },
    });
    if (error) return { error };
    if (data?.url) {
      if (Platform.OS === 'web') {
        window.location.href = data.url;
      } else {
        console.log('[Auth] signInWithKakao: opening auth session', {
          url: data.url,
          redirectTo,
        });
        await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    ...state,
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
