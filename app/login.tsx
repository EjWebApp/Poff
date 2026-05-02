import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../lib/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import Toast from 'react-native-toast-message';
import { ChefHat } from 'lucide-react-native';

const COOLDOWN_SEC = 60;

export default function LoginScreen() {
  const { signInWithOtp, signInWithKakao } = useAuth();
  const [email, setEmail] = useState('');
  const [mailSent, setMailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Supabase가 설정되지 않았습니다.{'\n'}
          .env에 EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSendMagicLink = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Toast.show({
        type: 'error',
        text1: '입력 확인',
        text2: '이메일을 입력하세요.',
      });
      return;
    }

    setLoading(true);
    try {
      const emailRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
      const { error } = await signInWithOtp(trimmedEmail, emailRedirectTo);

      if (error) {
        const isRateLimit =
          (error as { status?: number }).status === 429 ||
          error.message?.toLowerCase().includes('too many') ||
          error.message?.toLowerCase().includes('rate limit');
        Toast.show({
          type: 'error',
          text1: isRateLimit ? '잠시 후 다시 시도' : '전송 실패',
          text2: isRateLimit
            ? 'Magic Link는 60초마다 1회만 요청할 수 있어요.'
            : error.message,
          visibilityTime: isRateLimit ? 5000 : 4000,
        });
        if (isRateLimit) setCooldown(COOLDOWN_SEC);
        return;
      }

      Toast.show({ type: 'success', text1: '이메일 전송됨' });
      setMailSent(true);
      setCooldown(COOLDOWN_SEC);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithKakao = async () => {
    setKakaoLoading(true);
    try {
      const { error } = await signInWithKakao();
      if (error) {
        Toast.show({
          type: 'error',
          text1: '카카오 로그인 실패',
          text2: error.message,
        });
      }
    } finally {
      setKakaoLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <ChefHat size={32} color="#d97706" />
          <Text style={styles.title}>Poff</Text>
          <Text style={styles.subtitle}>
            {mailSent ? '이메일을 확인하세요' : '이메일로 로그인'}
          </Text>
        </View>

        {mailSent ? (
          <View style={styles.mailSentBox}>
            <Text style={styles.mailSentText}>
              {email} 로 메일을 보냈어요.{'\n'}
              이메일의 링크를 클릭하면 로그인됩니다.
            </Text>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                setMailSent(false);
                setCooldown(0);
              }}
              disabled={loading}
            >
              <Text style={styles.toggleBtnText}>다른 이메일로 다시 보내기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (loading || cooldown > 0) && styles.submitBtnDisabled,
              ]}
              onPress={handleSendMagicLink}
              disabled={loading || cooldown > 0}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : cooldown > 0 ? (
                <Text style={styles.submitBtnText}>
                  {cooldown}초 후 다시 보내기
                </Text>
              ) : (
                <Text style={styles.submitBtnText}>로그인 링크 보내기</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.kakaoBtn, kakaoLoading && styles.submitBtnDisabled]}
              onPress={handleSignInWithKakao}
              disabled={kakaoLoading}
            >
              {kakaoLoading ? (
                <ActivityIndicator color="#191919" />
              ) : (
                <Text style={styles.kakaoBtnText}>카카오로 로그인</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>돌아가기</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffef9',
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: 14,
    color: '#6b7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  kakaoBtnText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '600',
  },
  mailSentBox: {
    marginTop: 8,
  },
  mailSentText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  backBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});
