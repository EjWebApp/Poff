import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
  const { signInWithKakao, setAutoLogin, autoLogin } = useAuth();
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(autoLogin);
  const signingIn = useRef(false);

  if (!isSupabaseConfigured()) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Supabase가 설정되지 않았습니다.{'\n'}
          .env에 EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.
        </Text>
      </View>
    );
  }

  const handleSignInWithKakao = async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    setKakaoLoading(true);
    try {
      const { error } = await signInWithKakao();
      if (error) {
        Toast.show({ type: 'error', text1: '카카오 로그인 실패', text2: error.message });
      } else {
        if (autoLoginChecked) await setAutoLogin(true);
      }
    } finally {
      signingIn.current = false;
      setKakaoLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={require('../assets/poff.gif')}
            style={styles.character}
            resizeMode="contain"
          />
          <Text style={styles.title}>Poff</Text>
          <Text style={styles.subtitle}>로그인</Text>
        </View>

        <TouchableOpacity
          style={[styles.kakaoBtn, kakaoLoading && styles.kakaoBtnDisabled]}
          onPress={handleSignInWithKakao}
          disabled={kakaoLoading}
        >
          {kakaoLoading ? (
            <ActivityIndicator color="#191919" />
          ) : (
            <Text style={styles.kakaoBtnText}>카카오로 로그인</Text>
          )}
        </TouchableOpacity>

        <View style={styles.autoLoginRow}>
          <Text style={styles.autoLoginText}>자동 로그인</Text>
          <Switch
            value={autoLoginChecked}
            onValueChange={setAutoLoginChecked}
            trackColor={{ false: '#e5e7eb', true: '#FEE500' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
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
    fontFamily: 'Pacifico_400Regular',
    fontSize: 20,
    color: '#333333',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  kakaoBtn: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  kakaoBtnDisabled: {
    opacity: 0.7,
  },
  kakaoBtnText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '600',
  },
  autoLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  autoLoginText: {
    fontSize: 14,
    color: '#6b7280',
  },
  character: {
    width: 120,
    height: 120,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
