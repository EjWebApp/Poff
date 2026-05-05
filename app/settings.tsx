import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { useAuth } from '../lib/AuthContext';

export default function SettingsScreen() {
  const { user, autoLogin, setAutoLogin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 계정 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>이메일</Text>
            <Text style={styles.rowValue}>{user?.email ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>로그인 방식</Text>
            <Text style={styles.rowValue}>카카오</Text>
          </View>
        </View>

        {/* 로그인 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>로그인 설정</Text>
          <View style={styles.row}>
            <View style={styles.rowTextGroup}>
              <Text style={styles.rowLabel}>자동 로그인</Text>
              <Text style={styles.rowDesc}>앱 실행 시 자동으로 로그인</Text>
            </View>
            <Switch
              value={autoLogin}
              onValueChange={setAutoLogin}
              trackColor={{ false: '#e5e7eb', true: '#FEE500' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* 로그아웃 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <LogOut size={18} color="#ef4444" />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FAF7F2',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 32,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: '#374151',
  },
  rowDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  logoutText: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '500',
  },
});
