import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
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

export default function LoginScreen() {
  const { signInWithKakao } = useAuth();
  const [kakaoLoading, setKakaoLoading] = useState(false);

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
    backgroundColor: '#FAF7F2',
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
  backBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: '#9ca3af',
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
    marginBottom: 24,
  },
});
